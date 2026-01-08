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
        <div className="mb-12">
          {searchQuery ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-6 h-6 text-stone-600" />
                <h1 className="text-4xl md:text-5xl font-light text-stone-900">Search Results</h1>
              </div>
              <p className="text-xl text-stone-600">
                Found {totalProducts} {totalProducts === 1 ? 'product' : 'products'} for "{searchQuery}"
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-6xl font-light text-stone-900 mb-4">Our Collection</h1>
              <p className="text-xl text-stone-600">Discover pieces that define your style</p>
            </>
          )}
        </div>

        {!searchQuery && (
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="flex gap-4 flex-wrap flex-1">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`px-6 py-2 rounded-full transition-all duration-300 font-medium shadow-sm ${
                  selectedCategory === null 
                    ? 'bg-stone-900 text-white' 
                    : 'bg-white hover:bg-stone-900 hover:text-white text-stone-700'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-6 py-2 rounded-full transition-all duration-300 font-medium shadow-sm ${
                    selectedCategory === category.id 
                      ? 'bg-stone-900 text-white' 
                      : 'bg-white hover:bg-stone-900 hover:text-white text-stone-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="group">
                  <Link href={`/product/${product.id}`}>
                    <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-white mb-4 shadow-md hover:shadow-xl transition-all duration-500">
                      <img
                        src={product.image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />

                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-medium text-lg">Out of Stock</span>
                        </div>
                      )}

                      {product.new_arrival && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                          <Sparkles className="w-3 h-3" />
                          New
                        </div>
                      )}

                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleWishlistToggle(product.id);
                        }}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white shadow-lg"
                      >
                        <Heart 
                          className={`w-5 h-5 ${
                            isInWishlist(product.id) 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-stone-700'
                          }`} 
                        />
                      </button>
                    </div>
                  </Link>

                  <div className="space-y-2">
                    <p className="text-sm text-stone-500 font-medium">
                      {categories.find(c => c.id === product.category_id)?.name || 'Uncategorized'}
                    </p>
                    <Link href={`/product/${product.id}`}>
                      <h3 className="text-lg font-medium text-stone-900 group-hover:text-amber-700 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <p className="text-sm font-light text-stone-400 line-through">
                            {formatPrice(product.compare_at_price)}
                          </p>
                        )}
                        <p className="text-xl font-light text-stone-900">{formatPrice(product.price)}</p>
                      </div>
                      {product.stock > 0 && product.stock < 10 && (
                        <span className="text-xs text-amber-600 font-medium">
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
              <div className="mt-16 flex items-center justify-center gap-2">
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
