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

      {/* Shop by Category - Visual Grid */}
      <section className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-stone-900 mb-5 tracking-tight">Shop by Category</h2>
            <p className="text-stone-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">Find your perfect style</p>
          </div>

          {/* Custom Category Grid - Men & Women tall, Acc & New Season wide horizontal */}
          <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-6">
            {/* First Card - Men (Tall, spans 2 rows) */}
            <Link
              href="/shop?category=men"
              className="group relative overflow-hidden rounded-2xl md:rounded-3xl aspect-[3/4] md:aspect-auto md:row-span-2 shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <img
                src="https://feitifnjvtipgkinmuhp.supabase.co/storage/v1/object/public/products/announcements/men.jpg"
                alt="Men's Collection"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 group-hover:from-black/80 transition-colors duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2">Men</h3>
                <div className="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-sm md:text-base font-medium">Shop Now</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Second Card - Women (Tall, spans 2 rows) */}
            <Link
              href="/shop?category=women"
              className="group relative overflow-hidden rounded-2xl md:rounded-3xl aspect-[3/4] md:aspect-auto md:row-span-2 shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <img
                src="https://feitifnjvtipgkinmuhp.supabase.co/storage/v1/object/public/products/announcements/women.jpg"
                alt="Women's Collection"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 group-hover:from-black/80 transition-colors duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2">Women</h3>
                <div className="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-sm md:text-base font-medium">Shop Now</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Third Card - Accessories (Wide horizontal, spans 2 columns, 1 row - top right) */}
            <Link
              href="/shop?category=accessories"
              className="group relative overflow-hidden rounded-2xl md:rounded-3xl aspect-[3/4] md:aspect-[2/1] md:col-span-2 shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <img
                src="https://feitifnjvtipgkinmuhp.supabase.co/storage/v1/object/public/products/announcements/accessories.png"
                alt="Accessories Collection"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 group-hover:from-black/80 transition-colors duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2">Accessories</h3>
                <div className="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-sm md:text-base font-medium">Shop Now</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            {/* Fourth Card - New Season (Wide horizontal, spans 2 columns, 1 row - bottom right) */}
            <Link
              href="/new-arrivals"
              className="group relative overflow-hidden rounded-2xl md:rounded-3xl aspect-[3/4] md:aspect-[2/1] md:col-span-2 shadow-lg hover:shadow-2xl transition-all duration-500"
            >
              <img
                src="https://feitifnjvtipgkinmuhp.supabase.co/storage/v1/object/public/products/announcements/new-season.png"
                alt="New Season Collection"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 group-hover:from-black/80 transition-colors duration-500"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20">
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-2">New Season</h3>
                <div className="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-sm md:text-base font-medium">Shop Now</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section - Enhanced with better cards and micro-interactions */}
      {featuredProducts.length > 0 && (
        <section className="py-20 md:py-28 bg-gradient-to-b from-white via-stone-50/30 to-stone-50 relative overflow-hidden">
          {/* Decorative gradient orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-stone-200/30 rounded-full blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 md:mb-20">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-sm border border-amber-200/50">
                <Star className="w-4 h-4" fill="currentColor" />
                Featured
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-stone-900 mb-5 tracking-tight">Trending Now</h2>
              <p className="text-stone-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">Our most popular pieces this season</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 border border-stone-100 hover:border-stone-200">
                  <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-stone-100">
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
                    
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-semibold text-lg tracking-wide">Out of Stock</span>
                      </div>
                    )}

                    {product.new_arrival && (
                      <div className="absolute top-5 left-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                        New
                      </div>
                    )}

                    <div className="absolute top-5 right-5 bg-stone-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg">
                      Featured
                    </div>

                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleWishlistToggle(product.id);
                      }}
                      className="absolute bottom-5 right-5 w-14 h-14 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white shadow-xl hover:shadow-2xl"
                    >
                      <Heart 
                        className={`w-6 h-6 transition-all duration-300 ${
                          isInWishlist(product.id) 
                            ? 'fill-red-500 text-red-500 scale-110' 
                            : 'text-stone-700'
                        }`} 
                      />
                    </button>
                  </Link>

                  <div className="p-7">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="text-lg font-semibold text-stone-900 mb-3 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between mt-5">
                      <div className="flex items-center gap-2.5">
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-base font-light text-stone-400 line-through">{formatPrice(product.compare_at_price)}</span>
                        )}
                        <span className="text-2xl font-semibold text-stone-900">{formatPrice(product.price)}</span>
                      </div>
                      {product.stock > 0 && product.stock < 10 && (
                        <span className="text-xs text-red-600 font-bold bg-red-50 px-2.5 py-1 rounded-full">Only {product.stock} left</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <Link
                href="/shop"
                className="inline-flex items-center gap-3 px-10 py-5 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 font-semibold text-base"
              >
                View All Products
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section - Enhanced with modern grid and better visual hierarchy */}
      {newArrivals.length > 0 && (
        <section className="py-20 md:py-28 bg-gradient-to-b from-stone-50 via-amber-50/20 to-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-200/40 rounded-full blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 md:mb-20">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-sm border border-amber-200/50">
                <Sparkles className="w-4 h-4" />
                Just Arrived
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-stone-900 mb-5 tracking-tight">Fresh Picks</h2>
              <p className="text-stone-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">Discover the latest additions to our collection</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {newArrivals.map((product) => (
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
                    
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg shadow-amber-500/30 animate-pulse">
                      <Sparkles className="w-3 h-3" />
                      New
                    </div>

                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleWishlistToggle(product.id);
                      }}
                      className="absolute bottom-3 right-3 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white shadow-xl hover:shadow-2xl hover:rotate-12"
                    >
                      <Heart 
                        className={`w-5 h-5 transition-all duration-300 ${
                          isInWishlist(product.id) 
                            ? 'fill-red-500 text-red-500 scale-110' 
                            : 'text-stone-700'
                        }`} 
                      />
                    </button>
                  </Link>

                  <div className="p-5">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="text-base font-semibold text-stone-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="text-sm font-light text-stone-400 line-through">{formatPrice(product.compare_at_price)}</span>
                        )}
                        <span className="text-xl font-semibold text-stone-900">{formatPrice(product.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <Link
                href="/new-arrivals"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 font-semibold text-base"
              >
                <Sparkles className="w-5 h-5" />
                View All New Arrivals
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Collections Section - Enhanced with better image treatments and modern overlays */}
      {featuredCollections.length > 0 && (
        <section className="py-20 md:py-28 bg-gradient-to-b from-white via-stone-50/50 to-stone-50 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 md:mb-20">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-sm border border-blue-200/50">
                <Package className="w-4 h-4" />
                Curated
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-stone-900 mb-5 tracking-tight">Featured Collections</h2>
              <p className="text-stone-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">Curated selections for every style</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredCollections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="group relative overflow-hidden rounded-3xl aspect-[4/5] shadow-lg hover:shadow-2xl transition-all duration-700 border border-stone-100"
                >
                  {/* Enhanced gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10 group-hover:from-black/90 transition-colors duration-700"></div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-20"></div>
                  
                  {collection.image_url ? (
                    <img
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-500 flex items-center justify-center">
                      <Package className="w-20 h-20 text-white/50" />
                    </div>
                  )}
                  
                  <div className="absolute top-6 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-full text-xs font-bold z-20 shadow-lg shadow-amber-500/30">
                    Featured
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 z-20 transform group-hover:-translate-y-2 transition-transform duration-500">
                    <h3 className="text-3xl md:text-4xl font-light text-white mb-3 tracking-tight">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-stone-200 text-sm md:text-base mb-5 line-clamp-2 leading-relaxed">{collection.description}</p>
                    )}
                    <div className="inline-flex items-center gap-2 text-white text-base font-semibold opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <span>Explore Collection</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-16">
              <Link
                href="/collections"
                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-stone-900 border-2 border-stone-900 rounded-full hover:bg-stone-900 hover:text-white transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 font-semibold text-base"
              >
                View All Collections
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section - Enhanced with backdrop blur and better spacing */}
      <section className="py-20 md:py-28 bg-white relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-stone-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { icon: Truck, title: 'Free Shipping', desc: `On orders over ${formatPrice(settings.free_shipping_threshold)}`, gradient: 'from-blue-50 to-blue-100/50' },
              { icon: Shield, title: 'Secure Payment', desc: '100% protected checkout', gradient: 'from-emerald-50 to-emerald-100/50' },
              { icon: Sparkles, title: 'Premium Quality', desc: 'Handpicked materials', gradient: 'from-amber-50 to-amber-100/50' }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="text-center group hover:transform hover:-translate-y-3 transition-all duration-500 relative"
              >
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-md group-hover:shadow-2xl relative overflow-hidden`}>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <feature.icon className="w-9 h-9 text-stone-700 relative z-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-stone-900 mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-stone-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section - Enhanced with modern gradients and better visual hierarchy */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-2.5 rounded-full text-sm font-semibold mb-6 shadow-lg">
            <Sparkles className="w-4 h-4" />
            Exclusive Access
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-5 md:mb-7 tracking-tight">Join the lv8 Community</h2>
          <p className="text-stone-300 text-lg md:text-xl mb-10 md:mb-14 max-w-2xl mx-auto leading-relaxed">
            Subscribe to receive exclusive offers, style tips, and early access to new collections
          </p>

          <div className="max-w-lg mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-6 md:px-8 py-4 md:py-5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white/15 transition-all text-base shadow-lg"
            />
            <button className="px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold text-base w-full sm:w-auto shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105">
              Subscribe
            </button>
          </div>
          
          <p className="text-stone-400 text-sm mt-6">
            Join 10,000+ subscribers. Unsubscribe anytime.
          </p>
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
