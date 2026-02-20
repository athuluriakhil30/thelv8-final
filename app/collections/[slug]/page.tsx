'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Heart, Loader2, Package } from 'lucide-react';
import { collectionService } from '@/services/collection.service';
import { Collection, Product } from '@/types';
import { formatPrice } from '@/lib/helpers';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { CollectionPageSEO } from '@/components/SEO';

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef<string | null>(null);
  
  const { addItem } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    if (hasLoadedRef.current !== slug) {
      hasLoadedRef.current = slug;
      loadCollectionData();
    }
  }, [slug]);

  async function loadCollectionData() {
    try {
      setLoading(true);
      const collectionData = await collectionService.getCollectionBySlug(slug);
      
      if (!collectionData) {
        toast.error('Collection not found');
        router.push('/collections');
        return;
      }

      setCollection(collectionData);
      
      const productsData = await collectionService.getCollectionProducts(collectionData.id);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading collection:', error);
      toast.error('Failed to load collection');
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(product: Product) {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    // Get the first color - handle both string array and ProductColor array
    let firstColor = '';
    if (product.colors && product.colors.length > 0) {
      const color = product.colors[0];
      // If color is an object with name property, use name; otherwise use as string
      firstColor = typeof color === 'object' && 'name' in color ? color.name : String(color);
    }

    // Get the first size or empty string if no sizes
    const firstSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : '';

    // Validate that color and size exist (don't use 'default')
    if (!firstColor || !firstSize) {
      toast.error('Please select this item from the product page to choose color and size');
      return;
    }

    addItem(
      product.id,
      firstColor,
      firstSize,
      1
    );
    
    toast.success('Added to cart!');
  }

  function handleWishlistToggle(product: Product) {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* SEO Module - Structured Data & Meta Tags */}
      <CollectionPageSEO collection={collection} productCount={products.length} />
      
      {/* Collection Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {collection.image_url && (
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-200">
                <img
                  src={collection.image_url}
                  alt={collection.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className={collection.image_url ? '' : 'lg:col-span-2 text-center'}>
              <h1 className="text-5xl font-light text-stone-900 mb-4">{collection.name}</h1>
              {collection.description && (
                <p className="text-stone-600 text-lg leading-relaxed">
                  {collection.description}
                </p>
              )}
              <div className="mt-6 flex items-center gap-4 text-sm text-stone-500">
                <span>{products.length} Products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-stone-200">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-stone-400" />
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-medium text-lg">Out of Stock</span>
                    </div>
                  )}
                  {product.featured && (
                    <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Featured
                    </div>
                  )}
                </Link>

                <div className="p-6">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="text-lg font-medium text-stone-900 mb-2 group-hover:text-amber-700 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-light text-stone-900">{formatPrice(product.price)}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-sm text-stone-400 line-through">{formatPrice(product.compare_at_price)}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 bg-stone-900 text-white py-3 rounded-full hover:bg-stone-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleWishlistToggle(product)}
                      className={`p-3 rounded-full transition-colors ${
                        isInWishlist(product.id)
                          ? 'bg-red-100 text-red-600'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-stone-300 mx-auto mb-6" />
            <h2 className="text-2xl font-light text-stone-900 mb-2">No Products in This Collection</h2>
            <p className="text-stone-600 mb-8">
              This collection is currently empty. Check back soon!
            </p>
            <Link
              href="/collections"
              className="inline-block px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
            >
              Browse All Collections
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
