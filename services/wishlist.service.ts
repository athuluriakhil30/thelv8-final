import { supabase } from '@/lib/supabase/client';
import { handleSupabaseResponse, Insertable } from '@/lib/supabase/types';

type WishlistInsert = Insertable<'wishlist'>;
import { WishlistItem, Database } from '@/types';

export const wishlistService = {
  // Get user's wishlist
  async getWishlist(userId: string) {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*, product:products(*, category:categories(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as unknown as WishlistItem[];
  },

  // Add to wishlist
  async addToWishlist(userId: string, productId: string) {
    const insertData: WishlistInsert = {
      user_id: userId,
      product_id: productId,
    };
    const { data, error } = await supabase
      .from('wishlist')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove from wishlist
  async removeFromWishlist(userId: string, productId: string) {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;
  },

  // Check if product is in wishlist
  async isInWishlist(userId: string, productId: string) {
    const { data, error } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    return !!data && !error;
  },

  // Toggle wishlist
  async toggleWishlist(userId: string, productId: string) {
    const isInWishlist = await this.isInWishlist(userId, productId);
    
    if (isInWishlist) {
      await this.removeFromWishlist(userId, productId);
      return false;
    } else {
      await this.addToWishlist(userId, productId);
      return true;
    }
  },
};
