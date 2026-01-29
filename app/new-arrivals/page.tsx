'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, Loader2, Package, Sparkles } from 'lucide-react';
import { productService } from '@/services/product.service';
import { Product } from '@/types';
import { formatPrice } from '@/lib/helpers';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);
  
  const { addItem } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadNewArrivals();
    }
  }, []);

  async function loadNewArrivals() {
    try {
      setLoading(true);
      const data = await productService.getNewArrivals();
      setProducts(data);
    } catch (error) {
      console.error('Error loading new arrivals:', error);
      toast.error('Failed to load new arrivals');
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

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header - Enhanced */}
      <div className="bg-gradient-to-br from-amber-50 via-stone-50 to-stone-100 border-b border-stone-200 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-stone-200/40 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-sm border border-amber-200/50">
            <Sparkles className="w-4 h-4" />
            Just Arrived
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-stone-900 mb-5 tracking-tight">New Arrivals</h1>
          <p className="text-stone-600 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Discover our latest collection of premium clothing and accessories
          </p>
          <div className="mt-8 inline-flex items-center gap-2.5 bg-white px-7 py-4 rounded-full shadow-lg border border-stone-200">
            <span className="font-bold text-stone-900 text-lg">{products.length}</span>
            <span className="text-stone-600 font-medium">New Products</span>
          </div>
        </div>
      </div>

      {/* Products Grid - Enhanced */}
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <div key={product.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 border border-stone-100 hover:border-amber-200">
                <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-gradient-to-br from-stone-100 to-amber-50">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-stone-400" />
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white font-semibold text-lg tracking-wide">Out of Stock</span>
                    </div>
                  )}
                  <div className="absolute top-5 left-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/30 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                    New
                  </div>
                  {product.featured && (
                    <div className="absolute top-5 right-5 bg-stone-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg">
                      Featured
                    </div>
                  )}
                </Link>

                <div className="p-6">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="text-lg font-semibold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </Link>
                  
                  {product.category && (
                    <p className="text-xs text-stone-500 mb-3 font-medium uppercase tracking-wider">{product.category.name}</p>
                  )}
                  
                  <div className="flex items-baseline gap-2.5 mb-5">
                    <span className="text-2xl font-semibold text-stone-900">{formatPrice(product.price)}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <>
                        <span className="text-sm text-stone-400 line-through">{formatPrice(product.compare_at_price)}</span>
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          Save {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 bg-stone-900 text-white py-3.5 rounded-full hover:bg-stone-800 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleWishlistToggle(product)}
                      className={`p-3.5 rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-110 ${
                        isInWishlist(product.id)
                          ? 'bg-red-100 text-red-600'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <Heart className={`w-5 h-5 transition-all ${
                        isInWishlist(product.id) ? 'fill-current scale-110' : ''
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <Sparkles className="w-24 h-24 text-stone-300 mx-auto mb-6" />
            <h2 className="text-3xl font-light text-stone-900 mb-3 tracking-tight">No New Arrivals Yet</h2>
            <p className="text-stone-600 text-lg mb-10 leading-relaxed">
              Check back soon for fresh new products!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 px-10 py-5 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
