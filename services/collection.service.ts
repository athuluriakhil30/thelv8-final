import { supabase } from '@/lib/supabase/client';
import { Collection, Product } from '@/types';
import { Insertable, Updateable, handleSupabaseResponse } from '@/lib/supabase/types';

// Helper to add a timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

// Helper to add image_url field for backward compatibility
function addImageUrl(product: any): Product {
  return {
    ...product,
    image_url: product.images && product.images.length > 0 ? product.images[0] : null,
  };
}

export const collectionService = {
  // Get all published collections
  async getPublishedCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections' as any)
      .select('*')
      .eq('published', true)
      .order('name');

    if (error) throw error;
    return data as unknown as Collection[];
  },

  // Get featured collections
  async getFeaturedCollections(): Promise<Collection[]> {
    const { data, error } = await withTimeout(
      supabase
        .from('collections' as any)
        .select('*')
        .eq('published', true)
        .eq('featured', true)
        .order('name'),
      10000
    );

    if (error) {
      console.error('[CollectionService] Error fetching featured collections:', error);
      throw error;
    }
    return data as unknown as Collection[];
  },

  // Get collection by slug
  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections' as any)
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as unknown as Collection;
  },

  // Get products in a collection
  async getCollectionProducts(collectionId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('collection_products' as any)
      .select(`
        product_id,
        products:product_id (
          *,
          category:categories (*)
        )
      `)
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    
    // Extract products from the nested structure
    const products = data
      ?.map((item: any) => item.products)
      .filter((product: any) => product && product.published)
      .map(addImageUrl) || [];
    
    return products as unknown as Product[];
  },

  // Admin: Get all collections
  async getAllCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections' as any)
      .select('*')
      .order('name');

    if (error) throw error;
    return data as unknown as Collection[];
  },

  // Admin: Get collection by ID
  async getCollectionById(id: string): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as Collection;
  },

  // Admin: Create collection
  async createCollection(collection: Omit<Collection, 'id' | 'created_at' | 'updated_at'>): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections' as any)
      .insert(collection as any)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Collection;
  },

  // Admin: Update collection
  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections' as any)
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Collection;
  },

  // Admin: Delete collection
  async deleteCollection(id: string): Promise<void> {
    // First delete all collection_products relationships
    await supabase
      .from('collection_products' as any)
      .delete()
      .eq('collection_id', id);

    // Then delete the collection
    const { error } = await supabase
      .from('collections' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Admin: Add product to collection
  async addProductToCollection(collectionId: string, productId: string, sortOrder?: number): Promise<void> {
    const { error } = await supabase
      .from('collection_products' as any)
      .insert({
        collection_id: collectionId,
        product_id: productId,
        sort_order: sortOrder || 0,
      });

    if (error) throw error;
  },

  // Admin: Remove product from collection
  async removeProductFromCollection(collectionId: string, productId: string): Promise<void> {
    const { error } = await supabase
      .from('collection_products' as any)
      .delete()
      .eq('collection_id', collectionId)
      .eq('product_id', productId);

    if (error) throw error;
  },

  // Admin: Get products in collection (with unpublished)
  async getCollectionProductsAdmin(collectionId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('collection_products' as any)
      .select(`
        product_id,
        sort_order,
        products:product_id (
          *,
          category:categories (*)
        )
      `)
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    
    const products = data
      ?.map((item: any) => item.products)
      .filter((product: any) => product) || [];
    
    return products as unknown as Product[];
  },

  // Admin: Update product sort order in collection
  async updateProductSortOrder(collectionId: string, productId: string, sortOrder: number): Promise<void> {
    const { error } = await supabase
      .from('collection_products' as any)
      .update({ sort_order: sortOrder })
      .eq('collection_id', collectionId)
      .eq('product_id', productId);

    if (error) throw error;
  },
};
