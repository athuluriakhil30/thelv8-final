import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/server';
import { Product, BestSeller, ProductColor } from '@/types';

export interface AutoBestSeller {
  product_id: string;
  total_quantity: number;
  total_revenue: number;
}

export const bestSellerService = {
  /**
   * Get manually curated best sellers
   */
  async getManualBestSellers(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('best_sellers')
      .select(`
        *,
        product:products(*)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching manual best sellers:', error);
      return [];
    }

    return (data || [])
      .map((bs: any) => bs.product)
      .filter((p: any) => p && p.published)
      .map((product: any) => ({
        ...product,
        colors: product.colors as unknown as ProductColor[],
        images: product.images as unknown as string[],
        image_url: (product.images && Array.isArray(product.images) && product.images.length > 0 
          ? (product.images as string[])[0] 
          : undefined),
      })) as Product[];
  },

  /**
   * Get auto-calculated best sellers from order data
   */
  async getAutoBestSellers(limit: number = 8): Promise<Product[]> {
    try {
      // Call the database function to get best sellers
      const { data: autoData, error: autoError } = await supabase
        .rpc('get_auto_best_sellers', { limit_count: limit });

      if (autoError) {
        console.error('Error fetching auto best sellers:', autoError);
        return [];
      }

      if (!autoData || !Array.isArray(autoData) || autoData.length === 0) {
        return [];
      }

      // Get full product details
      const productIds = autoData.map((item: { product_id: string; total_quantity: number; total_revenue: number }) => item.product_id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .in('id', productIds)
        .eq('published', true);

      if (productsError) {
        console.error('Error fetching best seller products:', productsError);
        return [];
      }

      // Sort products by the order from auto best sellers and map with proper types
      const orderedProducts = productIds
        .map((id: string) => products?.find(p => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined)
        .map(product => ({
          ...product,
          colors: product.colors as unknown as ProductColor[],
          images: product.images as unknown as string[],
          image_url: (product.images && Array.isArray(product.images) && product.images.length > 0 ? (product.images as string[])[0] : undefined),
        })) as Product[];

      return orderedProducts;
    } catch (error) {
      console.error('Error in getAutoBestSellers:', error);
      return [];
    }
  },

  /**
   * Get best sellers - manual if available, otherwise auto-calculated
   */
  async getBestSellers(limit: number = 8): Promise<Product[]> {
    // First try to get manual best sellers
    const manualBestSellers = await this.getManualBestSellers();

    if (manualBestSellers.length > 0) {
      return manualBestSellers.slice(0, limit);
    }

    // Fall back to auto-calculated best sellers
    return await this.getAutoBestSellers(limit);
  },

  /**
   * ADMIN: Get all best seller entries with products
   */
  async getAllBestSellers(): Promise<BestSeller[]> {
    const { data, error } = await supabase
      .from('best_sellers')
      .select(`
        *,
        product:products(*)
      `)
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Cast colors and images from Json to proper types
    return (data || []).map(item => ({
      ...item,
      product: item.product ? {
        ...item.product,
        colors: item.product.colors as unknown as ProductColor[],
        images: item.product.images as unknown as string[],
        image_url: (item.product.images && Array.isArray(item.product.images) && item.product.images.length > 0 
          ? (item.product.images as string[])[0] 
          : undefined),
      } : undefined,
    })) as BestSeller[];
  },

  /**
   * ADMIN: Add product to best sellers
   */
  async addBestSeller(productId: string, displayOrder?: number): Promise<BestSeller> {
    const { data, error } = await supabase
      .from('best_sellers')
      .insert({
        product_id: productId,
        display_order: displayOrder ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as BestSeller;
  },

  /**
   * ADMIN: Remove product from best sellers
   */
  async removeBestSeller(id: string): Promise<void> {
    const { error } = await supabase
      .from('best_sellers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * ADMIN: Update best seller display order
   */
  async updateBestSellerOrder(id: string, displayOrder: number): Promise<void> {
    const { error } = await supabase
      .from('best_sellers')
      .update({ display_order: displayOrder, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * ADMIN: Toggle best seller active status
   */
  async toggleBestSeller(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('best_sellers')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * ADMIN: Reorder best sellers
   */
  async reorderBestSellers(items: { id: string; display_order: number }[]): Promise<void> {
    const promises = items.map((item) =>
      this.updateBestSellerOrder(item.id, item.display_order)
    );

    await Promise.all(promises);
  },
};
