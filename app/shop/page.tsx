'use client';

import { Suspense } from 'react';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, Heart, Loader2, Sparkles, Search } from 'lucide-react';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/helpers';
import { toast } from 'sonner';
import type { Product, Category } from '@/types';

function ShopPageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search');
  const categoryParam = searchParams.get('category');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;
  
  const { addItem } = useCart();
  const { items: wishlistItems, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  // Set category from URL parameter on mount - handle both slug and ID
  useEffect(() => {
    if (categoryParam && categories.length > 0) {
      // Try to find category by slug first (for URLs like ?category=accessories)
      const categoryBySlug = categories.find(cat => cat.slug === categoryParam);
      if (categoryBySlug) {
        setSelectedCategory(categoryBySlug.id);
      } else {
        // Fallback to ID if slug not found
        const categoryById = categories.find(cat => cat.id === categoryParam);
        if (categoryById) {
          setSelectedCategory(categoryParam);
        }
      }
    }
  }, [categoryParam, categories]);

  useEffect(() => {
    loadInitialData();
  }, [selectedCategory, currentPage, searchQuery]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * productsPerPage;
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts({
          category: selectedCategory || undefined,
          search: searchQuery || undefined,
          limit: productsPerPage,
          offset: offset
        }),
        categoryService.getCategories()
      ]);
      
      setProducts(productsData.products);
      setTotalProducts(productsData.total);
      setCategories(categoriesData);
      
      // Scroll to top when page changes
      if (currentPage > 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryChange(categoryId: string | null) {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  }

  function handleWishlistToggle(productId: string) {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    toggleWishlist(productId);
  }

  function isInWishlist(productId: string): boolean {
    return wishlistItems.some(item => item.product_id === productId);
  }
  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-stone-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 text-center">
          {searchQuery ? (
            <>
              <div className="flex items-center gap-3 mb-4 justify-center">
                <Search className="w-6 h-6 text-stone-600" />
                <h1 className="text-4xl md:text-5xl font-light text-stone-900">Search Results</h1>
              </div>
              <p className="text-xl text-stone-600">
                Found {totalProducts} {totalProducts === 1 ? 'product' : 'products'} for "{searchQuery}"
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-6xl font-light text-stone-900 mb-4 tracking-tight">Our Collection</h1>
              <p className="text-xl md:text-2xl text-stone-600 leading-relaxed">Discover pieces that define your style</p>
            </>
          )}
        </div>

        {!searchQuery && (
          <div className="mb-16">
            {/* Mobile: Horizontal scroll, Desktop: Centered wrap */}
            <div className="overflow-x-auto scrollbar-hide md:flex md:justify-center">
              <div className="inline-flex gap-2 md:gap-3 bg-white rounded-full p-2 shadow-lg border border-stone-100 min-w-max md:flex-wrap md:justify-center">
                <button
                  onClick={() => handleCategoryChange(null)}
                  className={`px-5 md:px-7 py-2.5 md:py-3 rounded-full transition-all duration-300 font-semibold text-xs md:text-sm tracking-wide whitespace-nowrap ${
                    selectedCategory === null 
                      ? 'bg-stone-900 text-white shadow-md' 
                      : 'bg-transparent hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-5 md:px-7 py-2.5 md:py-3 rounded-full transition-all duration-300 font-semibold text-xs md:text-sm tracking-wide whitespace-nowrap ${
                      selectedCategory === category.id 
                        ? 'bg-stone-900 text-white shadow-md' 
                        : 'bg-transparent hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-stone-600">
              {searchQuery 
                ? `No products found for "${searchQuery}"`
                : 'No products found in this category'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <div key={product.id} className="group">
                  <Link href={`/product/${product.id}`}>
                    <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-white mb-3 md:mb-4 shadow-md hover:shadow-xl transition-all duration-500">
                      <img
                        src={product.image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />

                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-white font-semibold text-sm md:text-base tracking-wide">Out of Stock</span>
                        </div>
                      )}

                      {product.new_arrival && (
                        <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1 shadow-lg">
                          <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          New
                        </div>
                      )}

                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleWishlistToggle(product.id);
                        }}
                        className="absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-lg"
                      >
                        <Heart 
                          className={`w-4 h-4 md:w-5 md:h-5 ${
                            isInWishlist(product.id) 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-stone-700'
                          }`} 
                        />
                      </button>
                    </div>
                  </Link>

                  <div className="space-y-1 md:space-y-2">
                    <p className="text-xs md:text-sm text-stone-500 font-medium">
                      {categories.find(c => c.id === product.category_id)?.name || 'Uncategorized'}
                    </p>
                    <Link href={`/product/${product.id}`}>
                      <h3 className="text-sm md:text-base lg:text-lg font-semibold text-stone-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <p className="text-xs md:text-sm font-light text-stone-400 line-through">
                            {formatPrice(product.compare_at_price)}
                          </p>
                        )}
                        <p className="text-base md:text-lg lg:text-xl font-semibold text-stone-900">{formatPrice(product.price)}</p>
                      </div>
                      {product.stock > 0 && product.stock < 10 && (
                        <span className="text-[10px] md:text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                          Only {product.stock} left
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalProducts > productsPerPage && (
              <div className="mt-12 md:mt-16 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white text-stone-900 rounded-lg hover:bg-stone-900 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.ceil(totalProducts / productsPerPage) }, (_, i) => i + 1)
                  .filter(page => {
                    const totalPages = Math.ceil(totalProducts / productsPerPage);
                    return page === 1 || 
                           page === totalPages || 
                           (page >= currentPage - 2 && page <= currentPage + 2);
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-2">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-stone-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ${
                          currentPage === page
                            ? 'bg-stone-900 text-white'
                            : 'bg-white text-stone-900 hover:bg-stone-900 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalProducts / productsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(totalProducts / productsPerPage)}
                  className="px-4 py-2 bg-white text-stone-900 rounded-lg hover:bg-stone-900 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  );
}
