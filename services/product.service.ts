import { supabase } from '@/lib/supabase/client';
import { Product } from '@/types';
import { Insertable, Updateable, handleSupabaseResponse } from '@/lib/supabase/types';

type ProductInsert = Insertable<'products'>;
type ProductUpdate = Updateable<'products'>;

// Helper to add image_url field for backward compatibility
function addImageUrl(product: any): Product {
  return {
    ...product,
    image_url: product.images && product.images.length > 0 ? product.images[0] : null,
  };
}

export const productService = {
  // Get all published products with pagination
  async getProducts(filters?: {
    category?: string;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('products')
      .select('*, category:categories(*)', { count: 'exact' })
      .eq('published', true);

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.featured) {
      query = query.eq('featured', true);
    }

    query = query.order('created_at', { ascending: false });

    const limit = filters?.limit || 12;
    const offset = filters?.offset || 0;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return {
      products: (data || []).map(addImageUrl) as Product[],
      total: count || 0
    };
  },

  // Get single product by slug
  async getProductBySlug(slug: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) throw error;
    return addImageUrl(data) as Product;
  },

  // Get single product by ID
  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return addImageUrl(data) as Product;
  },

  // Get featured products
  async getFeaturedProducts(limit = 6) {
    const result = await this.getProducts({ featured: true, limit });
    return result.products;
  },

  // Get related products
  async getRelatedProducts(productId: string, categoryId: string, limit = 4) {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('category_id', categoryId)
      .neq('id', productId)
      .eq('published', true)
      .limit(limit);

    if (error) throw error;
    return data as unknown as Product[];
  },

  // Get new arrival products
  async getNewArrivals(limit?: number) {
    let query = supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('published', true)
      .eq('new_arrival', true)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(addImageUrl) as Product[];
  },

  // Get products by category
  async getProductsByCategory(categorySlug: string) {
    // First get the category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();

    if (categoryError) throw categoryError;

    return this.getProducts({ category: category.id });
  },

  // Admin: Get all products (including unpublished)
  async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(addImageUrl) as unknown as Product[];
  },

  // Admin: Create product
  async createProduct(product: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return addImageUrl(data) as Product;
  },

  // Admin: Update product
  async updateProduct(id: string, updates: ProductUpdate): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return addImageUrl(data) as Product;
  },

  // Admin: Delete product
  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Admin: Upload product image
  async uploadProductImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  /**
   * Atomically decrease product stock for color+size combination
   * Uses the check_and_deduct_stock_color_size database function
   */
  async decreaseStockColorSize(
    productId: string,
    color: string,
    size: string,
    quantity: number
  ): Promise<{ success: boolean; remainingStock?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('check_and_deduct_stock_color_size', {
        p_product_id: productId,
        p_color: color,
        p_size: size,
        p_quantity: quantity,
      });

      if (error) {
        console.error('[ProductService] Error decreasing stock (color+size):', error);
        throw error;
      }

      if (!data) {
        console.error('[ProductService] No data returned from check_and_deduct_stock_color_size. The database function may not exist. Please run migration 011_add_stock_by_color_size.sql');
        throw new Error('Database function check_and_deduct_stock_color_size not available. Please contact support.');
      }

      const result = data as { success: boolean; remaining_stock?: number; error?: string };
      console.log('[ProductService] Stock decreased (color+size):', result);
      return {
        success: result.success,
        remainingStock: result.remaining_stock,
        error: result.success ? undefined : result.error
      };
    } catch (error) {
      console.error('[ProductService] decreaseStockColorSize failed:', error);
      throw error;
    }
  },

  /**
   * Atomically decrease product stock using database function
   * Prevents race conditions with row-level locking
   */
  async decreaseStock(
    productId: string,
    size: string | null,
    quantity: number
  ): Promise<{ success: boolean; currentStock: number; message: string }> {
    try {
      const { data, error } = await supabase.rpc('decrease_product_stock', {
        p_product_id: productId,
        p_size: size || '',
        p_quantity: quantity,
      });

      if (error) {
        console.error('[ProductService] Error decreasing stock:', error);
        throw error;
      }

      const result = data[0];
      console.log('[ProductService] Stock decreased:', result);
      return {
        success: result.success,
        currentStock: result.current_stock,
        message: result.message
      };
    } catch (error) {
      console.error('[ProductService] decreaseStock failed:', error);
      throw error;
    }
  },

  /**
   * Atomically increase product stock for color+size combination
   * Used for order cancellations and rollback
   */
  async increaseStockColorSize(
    productId: string,
    color: string,
    size: string,
    quantity: number
  ): Promise<{ success: boolean; newStock?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('increase_stock_color_size', {
        p_product_id: productId,
        p_color: color,
        p_size: size,
        p_quantity: quantity,
      });

      if (error) {
        console.error('[ProductService] Error increasing stock (color+size):', error);
        throw error;
      }

      if (!data) {
        console.error('[ProductService] No data returned from increase_stock_color_size. The database function may not exist. Please run migration 012_add_increase_stock_color_size.sql');
        throw new Error('Database function increase_stock_color_size not available. Please contact support.');
      }

      const result = data as { success: boolean; remaining_stock?: number; error?: string };
      console.log('[ProductService] Stock increased (color+size):', result);
      return {
        success: result.success,
        newStock: result.remaining_stock,
        error: result.success ? undefined : result.error
      };
    } catch (error) {
      console.error('[ProductService] increaseStockColorSize failed:', error);
      throw error;
    }
  },

  /**
   * Atomically increase product stock (for cancellations/returns)
   */
  async increaseStock(
    productId: string,
    size: string | null,
    quantity: number
  ): Promise<{ success: boolean; currentStock: number; message: string }> {
    try {
      const { data, error } = await supabase.rpc('increase_product_stock', {
        p_product_id: productId,
        p_size: size || '',
        p_quantity: quantity,
      });

      if (error) {
        console.error('[ProductService] Error increasing stock:', error);
        throw error;
      }

      const result = data[0];
      console.log('[ProductService] Stock increased:', result);
      return {
        success: result.success,
        currentStock: result.current_stock,
        message: result.message
      };
    } catch (error) {
      console.error('[ProductService] increaseStock failed:', error);
      throw error;
    }
  },

  /**
   * Validate that cart items have sufficient stock
   * Returns validation result and list of out-of-stock items
   */
  async validateCartStock(cartItems: any[]): Promise<{
    valid: boolean;
    outOfStockItems: any[];
  }> {
    try {
      // Format cart items for database function
      const formattedItems = cartItems.map((item) => ({
        product_id: item.product_id,
        selected_size: item.selected_size || '',
        quantity: item.quantity,
      }));

      const { data, error } = await supabase.rpc('validate_cart_stock', {
        p_cart_items: formattedItems,
      });

      if (error) {
        console.error('[ProductService] Error validating cart stock:', error);
        throw error;
      }

      const result = data[0];
      console.log('[ProductService] Cart validation:', result);

      return {
        valid: result.valid,
        outOfStockItems: Array.isArray(result.out_of_stock_items) 
          ? result.out_of_stock_items 
          : [],
      };
    } catch (error) {
      console.error('[ProductService] validateCartStock failed:', error);
      throw error;
    }
  },
};
