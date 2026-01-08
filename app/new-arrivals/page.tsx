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

    addItem(
      product.id,
      product.colors && product.colors.length > 0 ? product.colors[0].name : 'default',
      product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'default',
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
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-stone-100 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-amber-600" />
            <h1 className="text-5xl font-light text-stone-900">New Arrivals</h1>
            <Sparkles className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-stone-600 text-lg max-w-2xl mx-auto">
            Discover our latest collection of premium clothing and accessories
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm">
            <span className="font-medium text-stone-900">{products.length}</span>
            <span className="text-stone-600">New Products</span>
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
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    New
                  </div>
                  {product.featured && (
                    <div className="absolute top-4 right-4 bg-stone-900 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Featured
                    </div>
                  )}
                </Link>

                <div className="p-6">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="text-lg font-medium text-stone-900 mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  
                  {product.category && (
                    <p className="text-xs text-stone-500 mb-3">{product.category.name}</p>
                  )}
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-light text-stone-900">{formatPrice(product.price)}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <>
                        <span className="text-sm text-stone-400 line-through">{formatPrice(product.compare_at_price)}</span>
                        <span className="text-xs font-medium text-green-600">
                          Save {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                        </span>
                      </>
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
            <Sparkles className="w-20 h-20 text-stone-300 mx-auto mb-6" />
            <h2 className="text-2xl font-light text-stone-900 mb-2">No New Arrivals Yet</h2>
            <p className="text-stone-600 mb-8">
              Check back soon for fresh new products!
            </p>
            <Link
              href="/shop"
              className="inline-block px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
