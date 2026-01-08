'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/services/product.service';
import { formatPrice } from '@/lib/helpers';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { useRouter } from 'next/navigation';

interface WishlistItemWithProduct {
  id: string;
  product_id: string;
  product: Product;
}

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, toggleWishlist, loading } = useWishlist();
  const { addItem } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItemWithProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const hasRedirected = useRef(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!authLoading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      toast.error('Please login to view your wishlist');
      router.push('/shop');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user && !loading && items.length >= 0) {
      loadWishlistProducts();
    }
  }, [items.length, user, loading]);

  async function loadWishlistProducts() {
    if (!items || items.length === 0) {
      setWishlistItems([]);
      setLoadingProducts(false);
      return;
    }

    try {
      setLoadingProducts(true);
      const itemsWithProducts = await Promise.all(
        items.map(async (item) => {
          const product = await productService.getProductById(item.product_id);
          return {
            ...item,
            product: product!,
          };
        })
      );
      setWishlistItems(itemsWithProducts);
    } catch (error) {
      console.error('Error loading wishlist products:', error);
      toast.error('Failed to load wishlist items');
    } finally {
      setLoadingProducts(false);
    }
  }

  function handleRemove(productId: string) {
    toggleWishlist(productId);
    toast.success('Removed from wishlist');
  }

  function handleAddToCart(product: Product) {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    const color = product.colors && product.colors.length > 0 ? product.colors[0].name : 'default';
    const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'default';
    
    addItem(product.id, color, size, 1);
    
    toast.success('Added to cart!');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading || loadingProducts) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-16">
            <Heart className="w-24 h-24 text-stone-300 mx-auto mb-6" />
            <h1 className="text-4xl font-light text-stone-900 mb-4">Your Wishlist is Empty</h1>
            <p className="text-xl text-stone-600 mb-8">
              Save your favorite items to your wishlist
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-stone-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-light text-stone-900 mb-4">My Wishlist</h1>
          <p className="text-xl text-stone-600">
            {items.length} {items.length === 1 ? 'item' : 'items'} in your wishlist
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlistItems.map((item) => (
            <div key={item.id} className="group">
              <div className="relative">
                <Link href={`/product/${item.product_id}`}>
                  <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-white mb-4 shadow-md hover:shadow-xl transition-all duration-500">
                    <img
                      src={item.product.image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {item.product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-medium text-lg">Out of Stock</span>
                      </div>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => handleRemove(item.product_id)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-lg z-10"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>

              <div className="space-y-3">
                <Link href={`/product/${item.product_id}`}>
                  <h3 className="text-lg font-medium text-stone-900 group-hover:text-amber-700 transition-colors">
                    {item.product.name}
                  </h3>
                </Link>

                <div className="flex items-center justify-between">
                  <p className="text-xl font-light text-stone-900">
                    {formatPrice(item.product.price)}
                  </p>
                  {item.product.stock > 0 && item.product.stock < 10 && (
                    <span className="text-xs text-amber-600 font-medium">
                      Only {item.product.stock} left
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(item.product)}
                  disabled={item.product.stock === 0}
                  className="w-full py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {item.product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
