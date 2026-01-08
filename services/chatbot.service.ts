/**
 * Chatbot Service
 * Handles chatbot logic and data retrieval for AI context
 */

import { orderService } from './order.service';
import { collectionService } from './collection.service';
import { productService } from './product.service';
import { addressService } from './address.service';
import { supabaseAdmin } from '@/lib/supabase/server';

export interface UserContextData {
  orders: any[];
  collections: any[];
  addresses: any[];
  accountInfo?: any;
}

/**
 * Get comprehensive user context for AI chatbot
 */
export async function getUserContext(userId: string): Promise<UserContextData> {
  try {
    console.log('[ChatbotService] Fetching context for userId:', userId);
    
    // Fetch orders directly using supabaseAdmin (server-side)
    const fetchOrders = async () => {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[ChatbotService] Error fetching orders:', error);
        return [];
      }
      return data || [];
    };

    // Fetch addresses directly using supabaseAdmin
    const fetchAddresses = async () => {
      const { data, error } = await supabaseAdmin
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
      
      if (error) {
        console.error('[ChatbotService] Error fetching addresses:', error);
        return [];
      }
      return data || [];
    };
    
    const [orders, collections, addresses] = await Promise.all([
      fetchOrders(),
      collectionService.getAllCollections().catch((err) => {
        console.error('[ChatbotService] Error fetching collections:', err);
        return [];
      }),
      fetchAddresses(),
    ]);

    console.log('[ChatbotService] Fetched context:', {
      ordersCount: orders.length,
      collectionsCount: collections.length,
      addressesCount: addresses.length,
    });

    return {
      orders: orders.slice(0, 10), // Last 10 orders
      collections,
      addresses,
    };
  } catch (error) {
    console.error('[ChatbotService] Error fetching user context:', error);
    return {
      orders: [],
      collections: [],
      addresses: [],
    };
  }
}

/**
 * Format user context into AI-friendly text
 */
export function formatContextForAI(context: UserContextData): string {
  let contextText = '\n\nAvailable User Data:\n';

  // Orders
  if (context.orders.length > 0) {
    contextText += `\nRecent Orders (${context.orders.length}):\n`;
    context.orders.forEach((order, index) => {
      contextText += `${index + 1}. Order #${order.order_number}\n`;
      contextText += `   - Status: ${order.status}\n`;
      contextText += `   - Payment: ${order.payment_status}\n`;
      contextText += `   - Total: ₹${order.total}\n`;
      contextText += `   - Date: ${new Date(order.created_at).toLocaleDateString()}\n`;
      
      if (order.tracking_number) {
        contextText += `   - Tracking: ${order.tracking_number}\n`;
      }
      
      if (order.items && order.items.length > 0) {
        contextText += `   - Items: ${order.items.length} item(s)\n`;
      }
    });
  } else {
    contextText += '\nNo orders found.\n';
  }

  // Collections
  if (context.collections.length > 0) {
    contextText += `\nAvailable Collections (${context.collections.length}):\n`;
    context.collections.forEach((collection, index) => {
      contextText += `${index + 1}. ${collection.name}`;
      if (collection.description) {
        contextText += ` - ${collection.description.substring(0, 50)}...`;
      }
      contextText += '\n';
    });
  }

  // Addresses
  if (context.addresses.length > 0) {
    contextText += `\nSaved Addresses: ${context.addresses.length}\n`;
  }

  return contextText;
}

/**
 * Extract order intent from user message
 */
export function extractOrderIntent(message: string): {
  hasOrderIntent: boolean;
  orderNumber?: string;
} {
  const lowerMessage = message.toLowerCase();
  
  // Check for order-related keywords
  const orderKeywords = ['order', 'track', 'shipment', 'delivery', 'status'];
  const hasOrderIntent = orderKeywords.some(keyword => lowerMessage.includes(keyword));

  // Try to extract order number (format: ORD-XXXXXX)
  const orderNumberMatch = message.match(/ORD-\d{6}/i);
  
  return {
    hasOrderIntent,
    orderNumber: orderNumberMatch ? orderNumberMatch[0] : undefined,
  };
}

/**
 * Get specific order details for AI context
 */
export async function getOrderDetailsForAI(orderNumber: string): Promise<string> {
  try {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        address:addresses(*)
      `)
      .eq('order_number', orderNumber)
      .single();

    if (!order) {
      return `\nOrder ${orderNumber} not found.`;
    }

    let details = `\nDetailed Order Information for ${orderNumber}:\n`;
    details += `- Status: ${order.status}\n`;
    details += `- Payment Status: ${order.payment_status}\n`;
    details += `- Total Amount: ₹${order.total}\n`;
    details += `- Order Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}\n`;
    
    const orderData = order as any;
    if (orderData.tracking_number) {
      details += `- Tracking Number: ${orderData.tracking_number}\n`;
      details += `- Carrier: ${orderData.carrier || 'N/A'}\n`;
    }

    if (Array.isArray(orderData.items) && orderData.items.length > 0) {
      details += `\nOrdered Items:\n`;
      orderData.items.forEach((item: any, index: number) => {
        details += `${index + 1}. ${item.product_name} (Qty: ${item.quantity}) - ₹${item.price}\n`;
        if (item.selected_size) details += `   Size: ${item.selected_size}\n`;
        if (item.selected_color) details += `   Color: ${item.selected_color}\n`;
      });
    }

    if (orderData.address && typeof orderData.address === 'object') {
      details += `\nShipping Address:\n`;
      details += `${orderData.address.full_name}\n`;
      details += `${orderData.address.address_line1}\n`;
      if (orderData.address.address_line2) details += `${orderData.address.address_line2}\n`;
      details += `${orderData.address.city}, ${orderData.address.state} - ${orderData.address.pincode}\n`;
      details += `Phone: ${orderData.address.phone}\n`;
    }

    return details;
  } catch (error) {
    console.error('[ChatbotService] Error fetching order details:', error);
    return `\nUnable to fetch details for order ${orderNumber}.`;
  }
}

/**
 * Determine if user needs to raise a ticket
 */
export function shouldSuggestTicket(
  conversationLength: number,
  lastMessage: string
): boolean {
  // Suggest ticket if conversation is long
  if (conversationLength >= 8) {
    return true;
  }

  // Suggest ticket for complex issues
  const complexKeywords = [
    'problem', 'issue', 'wrong', 'mistake', 'error',
    'not working', 'doesn\'t work', 'broken', 'defective',
    'speak to', 'talk to', 'human', 'agent', 'manager'
  ];

  const lowerMessage = lastMessage.toLowerCase();
  return complexKeywords.some(keyword => lowerMessage.includes(keyword));
}
