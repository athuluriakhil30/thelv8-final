'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { CartItem } from '@/types';
import { cartService } from '@/services/cart.service';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cart: CartItem[];
  items: CartItem[]; // Alias for cart
  loading: boolean;
  addToCart: (productId: string, color: string, size: string, quantity?: number) => Promise<void>;
  addItem: (productId: string, color: string, size: string, quantity?: number) => Promise<void>; // Alias for addToCart
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>; // Alias for removeFromCart
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedUserId = useRef<string | null>(null);

  // Load cart when user logs in (only once per user)
  useEffect(() => {
    if (user && user.id !== loadedUserId.current) {
      loadedUserId.current = user.id;
      loadCart();
    } else if (!user && loadedUserId.current !== null) {
      loadedUserId.current = null;
      setCart([]);
    }
  }, [user?.id]);

  const loadCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const cartItems = await cartService.getCart(user.id);
      setCart(cartItems);
    } catch (error: any) {
      // Ignore AbortErrors (happens when component unmounts)
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Error loading cart:', error?.message || error);
      toast({
        title: 'Error',
        description: 'Failed to load cart',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, color: string, size: string, quantity = 1) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to cart',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Adding to cart:', { userId: user.id, productId, color, size, quantity });
      await cartService.addToCart(user.id, productId, color, size, quantity);
      await loadCart();
      toast({
        title: 'Added to cart',
        description: 'Item has been added to your cart',
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add item to cart',
        variant: 'destructive',
      });
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      await cartService.updateQuantity(cartItemId, quantity);
      await loadCart();
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive',
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await cartService.removeFromCart(cartItemId);
      await loadCart();
      toast({
        title: 'Removed from cart',
        description: 'Item has been removed from your cart',
      });
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      await cartService.clearCart(user.id);
      setCart([]);
      toast({
        title: 'Cart cleared',
        description: 'All items have been removed from your cart',
      });
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive',
      });
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const cartTotal = cart.reduce((sum, item) => {
    if (item.product) {
      return sum + (item.product.price * item.quantity);
    }
    return sum;
  }, 0);

  const value = {
    cart,
    items: cart, // Alias for cart
    loading,
    addToCart,
    addItem: addToCart, // Alias for addToCart
    updateQuantity,
    removeFromCart,
    removeItem: removeFromCart, // Alias for removeFromCart
    clearCart,
    cartCount,
    cartTotal,
    refreshCart: loadCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
