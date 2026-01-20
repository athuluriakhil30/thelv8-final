import { supabase } from '@/lib/supabase/client';
import { Order, OrderItem, Address } from '@/types';
import { Insertable, Updateable, handleSupabaseResponse } from '@/lib/supabase/types';
import { settingsService } from './settings.service';

type OrderInsert = Insertable<'orders'>;
type OrderUpdate = Updateable<'orders'>;

// Helper to map order data with aliases
function mapOrder(order: any): Order {
  return {
    ...order,
    order_items: order.items || [],
    address: order.shipping_address,
    gst: order.tax,
  };
}

export const orderService = {
  // Get user's orders
  async getOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapOrder) as Order[];
  },

  // Get user's orders (alias for compatibility)
  async getUserOrders(userId: string) {
    return this.getOrders(userId);
  },

  // Get current user's orders
  async getMyOrders() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');

    return this.getOrders(user.id);
  },

  // Get all orders (admin)
  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapOrder) as Order[];
  },

  // Get order by ID
  async getOrderById(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return mapOrder(data) as Order;
  },

  // Get order by order number
  async getOrderByNumber(orderNumber: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error) throw error;
    return mapOrder(data) as Order;
  },

  // Create order
  async createOrder(orderData: {
    userId: string;
    items: OrderItem[];
    shippingAddress: Address;
    paymentMethod: 'razorpay' | 'cod';
    subtotal: number;
    shippingCharge: number;
    tax: number;
    discount: number;
    total: number;
    paymentId?: string;
    notes?: string;
    couponCode?: string | null;
  }) {
    // Import product service for stock operations
    const { productService } = await import('./product.service');

    // Step 1: Validate cart stock before proceeding
    console.log('[OrderService] Validating stock for', orderData.items.length, 'items');

    const cartItems = orderData.items.map((item) => ({
      product_id: item.product_id,
      selected_size: item.selected_size,
      quantity: item.quantity,
    }));

    const validation = await productService.validateCartStock(cartItems);

    if (!validation.valid) {
      console.error('[OrderService] Stock validation failed:', validation.outOfStockItems);
      throw new Error(
        `Some items are out of stock: ${JSON.stringify(validation.outOfStockItems)}`
      );
    }

    // Step 2: Atomically decrease stock for each item
    console.log('[OrderService] Decreasing stock for items');
    const stockResults: Array<{ productId: string; color: string; size: string; success: boolean; message: string }> = [];

    try {
      for (const item of orderData.items) {
        let result: { success: boolean; remainingStock?: number; error?: string; message?: string; currentStock?: number };
        
        // Use color+size stock deduction if both color and size are provided
        if (item.selected_color && item.selected_size) {
          console.log(`[OrderService] Decreasing stock for ${item.product_id} - Color: ${item.selected_color}, Size: ${item.selected_size}, Qty: ${item.quantity}`);
          result = await productService.decreaseStockColorSize(
            item.product_id,
            item.selected_color,
            item.selected_size,
            item.quantity
          );
          result.message = result.error || 'Stock decreased successfully';
        } else {
          // Fallback to size-only stock deduction
          result = await productService.decreaseStock(
            item.product_id,
            item.selected_size || null,
            item.quantity
          );
        }

        stockResults.push({
          productId: item.product_id,
          color: item.selected_color,
          size: item.selected_size,
          success: result.success,
          message: result.message || 'Unknown error',
        });

        if (!result.success) {
          // Rollback: Restore stock for previously decreased items
          console.error('[OrderService] Stock decrease failed for', item.product_id, '- Rolling back');

          for (const previous of stockResults.slice(0, -1)) {
            if (previous.success) {
              const rollbackItem = orderData.items.find(i => i.product_id === previous.productId);
              if (rollbackItem) {
                // Use color+size stock restoration if both are available
                if (rollbackItem.selected_color && rollbackItem.selected_size) {
                  await productService.increaseStockColorSize(
                    rollbackItem.product_id,
                    rollbackItem.selected_color,
                    rollbackItem.selected_size,
                    rollbackItem.quantity
                  );
                } else {
                  await productService.increaseStock(
                    rollbackItem.product_id,
                    rollbackItem.selected_size || null,
                    rollbackItem.quantity
                  );
                }
              }
            }
          }

          throw new Error(`Insufficient stock for item: ${result.message}`);
        }
      }

      console.log('[OrderService] Stock decreased successfully for all items');

      // Step 3: Create order (stock already decremented)
      const orderNumber = await this.generateOrderNumber();

      const insertData: OrderInsert = {
        user_id: orderData.userId,
        order_number: orderNumber,
        status: 'pending',
        payment_status: orderData.paymentMethod === 'cod' ? 'pending' : 'pending',
        payment_method: orderData.paymentMethod,
        payment_id: orderData.paymentId || null,
        subtotal: orderData.subtotal,
        shipping_charge: orderData.shippingCharge,
        tax: orderData.tax,
        discount: orderData.discount,
        total: orderData.total,
        shipping_address: orderData.shippingAddress as any,
        items: orderData.items as any,
        notes: orderData.notes || null,
        coupon_code: orderData.couponCode || null,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Rollback: Restore stock if order creation fails
        console.error('[OrderService] Order creation failed - Rolling back stock');

        for (const item of orderData.items) {
          if (item.selected_color && item.selected_size) {
            await productService.increaseStockColorSize(
              item.product_id,
              item.selected_color,
              item.selected_size,
              item.quantity
            );
          } else {
            await productService.increaseStock(
              item.product_id,
              item.selected_size || null,
              item.quantity
            );
          }
        }

        throw error;
      }

      console.log('[OrderService] Order created successfully:', orderNumber);
      return data as unknown as Order;
    } catch (error) {
      console.error('[OrderService] Error in createOrder:', error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: Order['status']) {
    const updateData: OrderUpdate = { status };
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Order;
  },

  // Update order
  async updateOrder(orderId: string, updates: OrderUpdate) {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Order;
  },

  // Update payment status
  async updatePaymentStatus(orderId: string, paymentStatus: Order['payment_status'], paymentId?: string) {
    const updates: OrderUpdate = {
      payment_status: paymentStatus,
      // When payment is successful, also update order status to confirmed
      ...(paymentStatus === 'paid' && { status: 'confirmed' })
    };
    if (paymentId) {
      updates.payment_id = paymentId;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Order;
  },

  // Cancel order
  async cancelOrder(orderId: string, reason?: string) {
    // Import product service for stock operations
    const { productService } = await import('./product.service');

    // Get order details first
    const order = await this.getOrderById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Only restore stock if order is pending or confirmed (not shipped/delivered)
    const canRestoreStock = ['pending', 'confirmed'].includes(order.status);

    if (canRestoreStock) {
      console.log('[OrderService] Restoring stock for cancelled order:', order.order_number);

      // Restore stock for each item
      for (const item of order.order_items || order.items || []) {
        try {
          // Use color+size stock restoration if both are available
          if (item.selected_color && item.selected_size) {
            console.log(`[OrderService] Restoring color+size stock for ${item.product_id} - Color: ${item.selected_color}, Size: ${item.selected_size}, Qty: ${item.quantity}`);
            await productService.increaseStockColorSize(
              item.product_id,
              item.selected_color,
              item.selected_size,
              item.quantity
            );
          } else {
            // Fallback to size-only stock restoration
            await productService.increaseStock(
              item.product_id,
              item.selected_size || null,
              item.quantity
            );
          }
          console.log('[OrderService] Stock restored for product:', item.product_id);
        } catch (error) {
          console.error('[OrderService] Failed to restore stock for', item.product_id, error);
          // Continue with other items even if one fails
        }
      }
    }

    const updateData: OrderUpdate = {
      status: 'cancelled',
      notes: reason || null,
    };
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    console.log('[OrderService] Order cancelled successfully:', order.order_number);
    return mapOrder(data) as Order;
  },

  // Admin: Get all orders with filters
  async getAdminOrders(filters?: {
    status?: string;
    paymentStatus?: string;
    limit?: number;
  }) {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.paymentStatus) {
      query = query.eq('payment_status', filters.paymentStatus);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(mapOrder) as Order[];
  },

  // Generate order number
  async generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `ORD${year}${month}${day}${random}`;
  },

  // Calculate order totals
  async calculateTotals(items: OrderItem[], shippingCharge = 0, discount = 0) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Get GST from settings instead of hardcoding
    const settings = await settingsService.getSettings();
    const tax = (subtotal * settings.gst_percentage) / 100;
    const total = subtotal + shippingCharge + tax - discount;

    return {
      subtotal,
      tax,
      total,
    };
  },
};
