import { supabase } from '@/lib/supabase/client';
import { CartItem } from '@/types';
import { Insertable, Updateable, handleSupabaseResponse } from '@/lib/supabase/types';
import { productService } from './product.service';
import { getAvailableStock, validateSingleItem } from '@/lib/cart-validation';

// Local cart row type
type CartRow = {
  created_at: string;
  id: string;
  product_id: string;
  quantity: number | null;
  selected_color: string;
  selected_size: string;
  updated_at: string;
  user_id: string;
};

// Cart insert type
type CartInsert = {
  created_at?: string;
  id?: string;
  product_id: string;
  quantity?: number | null;
  selected_color: string;
  selected_size: string;
  updated_at?: string;
  user_id: string;
};

export const cartService = {
  // Get user's cart
  async getCart(userId: string) {
    const { data, error } = await supabase
      .from('cart')
      .select('*, product:products(*, category:categories(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as unknown as CartItem[];
  },

  // Add item to cart
  async addToCart(userId: string, productId: string, color: string, size: string, quantity = 1) {
    try {
      // Use default values if color/size are empty
      const selectedColor = color || 'default';
      const selectedSize = size || 'default';
      
      console.log('Cart service - adding:', { userId, productId, selectedColor, selectedSize, quantity });
      
      // Validate stock availability before adding
      try {
        const product = await productService.getProductById(productId);
        if (!product) {
          throw new Error('Product not found');
        }

        // Check if item already exists to account for existing quantity
        const { data: existing } = await supabase
          .from('cart')
          .select('quantity')
          .eq('user_id', userId)
          .eq('product_id', productId)
          .eq('selected_color', selectedColor)
          .eq('selected_size', selectedSize)
          .maybeSingle();

        const currentQuantity = existing?.quantity || 0;
        
        // Validate stock
        const validation = validateSingleItem(
          product,
          selectedSize === 'default' ? null : selectedSize,
          quantity,
          currentQuantity
        );

        if (!validation.valid) {
          throw new Error(validation.message || 'Insufficient stock');
        }
      } catch (stockError: any) {
        console.error('Stock validation failed:', stockError);
        throw new Error(stockError.message || 'Failed to validate stock');
      }
      
      // Check if item already exists
      const { data: existing, error: existingError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('selected_color', selectedColor)
        .eq('selected_size', selectedSize)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        console.error('Error checking existing cart item:', existingError);
        throw new Error(existingError.message || 'Failed to check cart');
      }

      if (existing) {
        // Update quantity
        const existingData = existing as CartRow;
        const { data, error } = await supabase
          .from('cart')
          .update({ quantity: (existingData.quantity || 0) + quantity })
          .eq('id', existingData.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating cart quantity:', error);
          throw new Error(error.message || 'Failed to update cart');
        }
        return data;
      } else {
        // Insert new item
        const insertData: CartInsert = {
          user_id: userId,
          product_id: productId,
          selected_color: selectedColor,
          selected_size: selectedSize,
          quantity,
        };
        
        console.log('Inserting cart item:', insertData);
        
        const { data, error } = await supabase
          .from('cart')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting cart item:', error);
          throw new Error(error.message || 'Failed to add to cart. Please check if you are signed in.');
        }
        return data;
      }
    } catch (err: any) {
      console.error('Cart service error:', err);
      throw err;
    }
  },

  // Update cart item quantity
  async updateQuantity(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeFromCart(cartItemId);
    }

    // Validate stock before updating
    try {
      const { data: cartItem } = await supabase
        .from('cart')
        .select('product_id, selected_size, quantity')
        .eq('id', cartItemId)
        .single();

      if (cartItem) {
        const product = await productService.getProductById(cartItem.product_id);
        if (product) {
          const validation = validateSingleItem(
            product,
            cartItem.selected_size === 'default' ? null : cartItem.selected_size,
            quantity,
            0 // We're setting absolute quantity, not adding
          );

          if (!validation.valid) {
            throw new Error(validation.message || 'Insufficient stock');
          }
        }
      }
    } catch (error: any) {
      console.error('Stock validation failed during update:', error);
      throw new Error(error.message || 'Failed to validate stock');
    }

    const { data, error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove item from cart
  async removeFromCart(cartItemId: string) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
  },

  // Clear entire cart
  async clearCart(userId: string) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Get cart count
  async getCartCount(userId: string) {
    const { count, error } = await supabase
      .from('cart')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  },
};
