'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, ShoppingBag, Sparkles, Shield, Truck, TrendingUp, Heart, Star, Loader2, Package } from 'lucide-react';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import { productService } from '@/services/product.service';
import { collectionService } from '@/services/collection.service';
import { settingsService } from '@/services/settings.service';
import { Product, Collection } from '@/types';
import { formatPrice } from '@/lib/helpers';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([]);
  const [settings, setSettings] = useState({ free_shipping_threshold: 500 });
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);
  const { user } = useAuth();
  const { items: wishlistItems, toggleWishlist } = useWishlist();
  const [animationData, setAnimationData] = useState(null);
  const [mobileAnimationData, setMobileAnimationData] = useState(null);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadHomeData();
    }
  }, []);

  // Load Lottie animations - Update the paths to match your file locations
  useEffect(() => {
    // Desktop animation
    fetch('/animations/hero.json') // Change this to your desktop Lottie file path
      .then(res => {
        if (!res.ok) throw new Error('Animation file not found');
        return res.json();
      })
      .then(data => setAnimationData(data))
      .catch(err => {
        console.log('Desktop Lottie animation not loaded:', err.message);
      });

    // Mobile animation
    fetch('/animations/mobile.json') // Change this to your mobile Lottie file path
      .then(res => {
        if (!res.ok) throw new Error('Mobile animation file not found');
        return res.json();
      })
      .then(data => setMobileAnimationData(data))
      .catch(err => {
        console.log('Mobile Lottie animation not loaded:', err.message);
      });
  }, []);

  async function loadHomeData() {
    try {
      const [productsData, arrivals, collections, siteSettings] = await Promise.all([
        productService.getProducts({ featured: true, limit: 6 }),
        productService.getNewArrivals(4),
        collectionService.getFeaturedCollections(),
        settingsService.getSettings()
      ]);
      
      setFeaturedProducts(productsData.products);
      setNewArrivals(arrivals);
      setFeaturedCollections(collections.slice(0, 3));
      setSettings(siteSettings);
    } catch (error: any) {
      // Ignore AbortErrors (happens when component unmounts)
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Error loading home data:', error?.message || error);
    } finally {
      setLoading(false);
    }
  }

  function handleWishlistToggle(productId: string) {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    toggleWishlist(productId);
  }

  function isInWishlist(productId: string): boolean {
    return wishlistItems?.some((item) => item.product_id === productId) || false;
  }

  return (
    <div className="min-h-screen">
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-stone-50 via-amber-50 to-stone-100">
        {/* Mobile Lottie Animation Background */}
        {mobileAnimationData && (
          <div 
            className="md:hidden absolute inset-0 z-0"
            style={{
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div 
              className="w-[300vw] h-[300vh]"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Lottie 
                animationData={mobileAnimationData} 
                loop={true}
                style={{ 
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
          </div>
        )}

        {/* Desktop Lottie Animation Background */}
        {animationData && (
          <div 
            className="hidden md:block absolute inset-0 z-0"
            style={{
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div 
              className="w-[200vw] h-[200vh]"
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Lottie 
                animationData={animationData} 
                loop={true}
                style={{ 
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
          </div>
        )}

        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-stone-400 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-stone-400 rounded-full animate-scroll"></div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { icon: Truck, title: 'Free Shipping', desc: `On orders over ${formatPrice(settings.free_shipping_threshold)}` },
              { icon: Shield, title: 'Secure Payment', desc: '100% protected checkout' },
              { icon: Sparkles, title: 'Premium Quality', desc: 'Handpicked materials' }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="text-center group hover:transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-6 group-hover:bg-amber-100 transition-colors">
                  <feature.icon className="w-8 h-8 text-amber-700" />
                </div>
                <h3 className="text-xl font-medium text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-stone-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-stone-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Star className="w-4 h-4" />
                Featured
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-stone-900 mb-4">Trending Now</h2>
              <p className="text-stone-600 text-base md:text-lg">Our most popular pieces this season</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500">
                  <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-stone-200">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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

                    {product.new_arrival && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        New
                      </div>
                    )}

                    <div className="absolute top-4 right-4 bg-stone-900 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Featured
                    </div>

                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleWishlistToggle(product.id);
                      }}
                      className="absolute bottom-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-lg"
                    >
                      <Heart 
                        className={`w-5 h-5 ${
                          isInWishlist(product.id) 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-stone-700'
                        }`} 
                      />
                    </button>
                  </Link>

                  <div className="p-6">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="text-lg font-medium text-stone-900 mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-base font-light text-stone-400 line-through">{formatPrice(product.compare_at_price)}</span>
                        )}
                        <span className="text-2xl font-light text-stone-900">{formatPrice(product.price)}</span>
                      </div>
                      {product.stock > 0 && product.stock < 10 && (
                        <span className="text-xs text-red-600 font-medium">Only {product.stock} left</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                View All Products
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Just Arrived
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-stone-900 mb-4">Fresh Picks</h2>
              <p className="text-stone-600 text-base md:text-lg">Discover the latest additions to our collection</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {newArrivals.map((product) => (
                <div key={product.id} className="group bg-stone-50 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500">
                  <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-stone-200">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-stone-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      New
                    </div>

                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleWishlistToggle(product.id);
                      }}
                      className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-lg"
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          isInWishlist(product.id) 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-stone-700'
                        }`} 
                      />
                    </button>
                  </Link>

                  <div className="p-5">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="text-base font-medium text-stone-900 mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-sm font-light text-stone-400 line-through">{formatPrice(product.compare_at_price)}</span>
                        )}
                        <span className="text-xl font-light text-stone-900">{formatPrice(product.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/new-arrivals"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Sparkles className="w-5 h-5" />
                View All New Arrivals
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Collections Section */}
      {featuredCollections.length > 0 && (
        <section className="py-16 md:py-24 bg-gradient-to-b from-stone-50 to-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-stone-900 mb-4">Featured Collections</h2>
              <p className="text-stone-600 text-base md:text-lg">Curated selections for every style</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="group relative overflow-hidden rounded-2xl aspect-[4/5] shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>
                  {collection.image_url ? (
                    <img
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center">
                      <Package className="w-20 h-20 text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium z-20">
                    Featured
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                    <h3 className="text-3xl font-light text-white mb-2">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-stone-200 text-sm mb-4 line-clamp-2">{collection.description}</p>
                    )}
                    <div className="inline-flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      Explore Collection
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-stone-900 border-2 border-stone-900 rounded-full hover:bg-stone-900 hover:text-white transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1"
              >
                View All Collections
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 md:py-24 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light mb-4 md:mb-6">Join the lv8 Community</h2>
          <p className="text-stone-300 text-base md:text-lg mb-8 md:mb-12 max-w-2xl mx-auto">
            Subscribe to receive exclusive offers, style tips, and early access to new collections
          </p>

          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 md:px-6 py-3 md:py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button className="px-6 md:px-8 py-3 md:py-4 bg-amber-600 text-white rounded-full hover:bg-amber-500 transition-colors font-medium w-full sm:w-auto">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scroll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(12px);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }

        .animate-scroll {
          animation: scroll 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
