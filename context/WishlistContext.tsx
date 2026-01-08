'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { WishlistItem } from '@/types';
import { wishlistService } from '@/services/wishlist.service';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WishlistContextType {
  wishlist: WishlistItem[];
  items: WishlistItem[]; // Alias for wishlist
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedUserId = useRef<string | null>(null);
  const isVisible = useRef(true);

  // Track visibility to prevent wishlist reload on tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load wishlist when user logs in (only once per user and when visible)
  useEffect(() => {
    if (user && user.id !== loadedUserId.current && isVisible.current) {
      loadedUserId.current = user.id;
      loadWishlist();
    } else if (!user && loadedUserId.current !== null) {
      loadedUserId.current = null;
      setWishlist([]);
    }
  }, [user?.id]);

  const loadWishlist = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const wishlistItems = await wishlistService.getWishlist(user.id);
      setWishlist(wishlistItems);
    } catch (error: any) {
      // Ignore AbortErrors (happens when component unmounts)
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Error loading wishlist:', error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to wishlist',
        variant: 'destructive',
      });
      return;
    }

    try {
      await wishlistService.addToWishlist(user.id, productId);
      await loadWishlist();
      toast({
        title: 'Added to wishlist',
        description: 'Item has been added to your wishlist',
      });
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to wishlist',
        variant: 'destructive',
      });
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      await wishlistService.removeFromWishlist(user.id, productId);
      await loadWishlist();
      toast({
        title: 'Removed from wishlist',
        description: 'Item has been removed from your wishlist',
      });
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save items to wishlist',
        variant: 'destructive',
      });
      return;
    }

    const inWishlist = isInWishlist(productId);
    
    if (inWishlist) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.product_id === productId);
  };

  const value = {
    wishlist,
    items: wishlist, // Alias for wishlist
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    refreshWishlist: loadWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
