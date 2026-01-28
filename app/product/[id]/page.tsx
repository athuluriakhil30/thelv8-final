'use client';

import { useEffect, useState, useRef } from 'react';
import { Heart, Share2, Truck, RefreshCw, Shield, Star, Loader2, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { productService } from '@/services/product.service';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { settingsService } from '@/services/settings.service';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/helpers';
import { getAvailableStock, validateSingleItem } from '@/lib/cart-validation';
import { toast } from 'sonner';
import type { Product, ProductColor } from '@/types';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const hasLoadedRef = useRef<string | null>(null);
  const [settings, setSettings] = useState({ free_shipping_threshold: 500 });
  
  // Touch handling for swipe
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const { addItem, items } = useCart();
  const { items: wishlistItems, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!product?.images || product.images.length <= 1) return;
    
    const swipeThreshold = 50; // Minimum distance for a swipe
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - next image
        setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
      } else {
        // Swiped right - previous image
        setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
      }
    }
  };

  // Helper to get available stock for current color+size selection
  function getAvailableStockForSelection(): number {
    if (!product) return 0;

    // Check if product has color+size stock tracking
    if (product.stock_by_color_size && 
        selectedColor && 
        selectedSize &&
        typeof product.stock_by_color_size === 'object') {
      const colorStock = product.stock_by_color_size[selectedColor];
      if (colorStock && typeof colorStock === 'object') {
        return colorStock[selectedSize] || 0;
      }
      return 0;
    }

    // Fallback to stock_by_size if only sizes exist
    if (product.stock_by_size && selectedSize) {
      return product.stock_by_size[selectedSize] || 0;
    }

    // Fallback to total stock
    return product.stock || 0;
  }

  useEffect(() => {
    if (hasLoadedRef.current !== productId) {
      hasLoadedRef.current = productId;
      loadProduct();
    }
  }, [productId]);

  // Helper to normalize color data - supports both string[] and ProductColor[]
  function normalizeColor(color: string | ProductColor): ProductColor {
    if (typeof color === 'string') {
      // Convert string to ProductColor object with a default hex
      return {
        name: color,
        hex: '#808080', // Default gray color
      };
    }
    return color;
  }

  async function loadProduct() {
    try {
      setLoading(true);
      const productData = await productService.getProductById(productId);

      if (!productData) {
        toast.error('Product not found');
        router.push('/shop');
        return;
      }

      setProduct(productData);
      const siteSettings = await settingsService.getSettings();
      setSettings(siteSettings);

      // Set default selections
      if (productData.sizes && productData.sizes.length > 0) {
        setSelectedSize(productData.sizes[0]);
      }
      if (productData.colors && productData.colors.length > 0) {
        const normalizedColor = normalizeColor(productData.colors[0]);
        setSelectedColor(normalizedColor.name);
      }

      // Load related products
      if (productData.category_id) {
        const related = await productService.getRelatedProducts(productId, productData.category_id, 4);
        setRelatedProducts(related);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart() {
    if (!product) return;

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }

    // Check stock for selected color+size combination
    const availableStock = getAvailableStockForSelection();
    
    if (availableStock === 0) {
      toast.error('This color and size combination is out of stock');
      return;
    }

    // Find existing cart item with same product/size/color
    const existingCartItem = items.find(
      item => item.product_id === product.id &&
        item.selected_size === (selectedSize || '') &&
        item.selected_color === (selectedColor || '')
    );

    const existingQuantity = existingCartItem?.quantity || 0;
    
    if (existingQuantity + quantity > availableStock) {
      toast.error(`Only ${availableStock} available for this color and size combination`);
      return;
    }

    addItem(
      product.id,
      selectedColor || '',
      selectedSize || '',
      quantity
    );

    toast.success('Added to cart!');
  }

  function handleWishlistToggle() {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    if (product) {
      toggleWishlist(product.id);
    }
  }

  function isInWishlist(): boolean {
    return product ? wishlistItems.some(item => item.product_id === product.id) : false;
  }

  async function handleShare() {
    try {
      await navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800'];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <Link href="/shop" className="text-stone-600 hover:text-stone-900 transition-colors">
            ← Back to Shop
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          <div>
            <div 
              className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-stone-100 mb-4 shadow-lg group"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {getAvailableStockForSelection() === 0 && selectedColor && selectedSize && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">Out of Stock</span>
                </div>
              )}
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6 text-stone-900" />
                  </button>
                  <button
                    onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6 text-stone-900" />
                  </button>
                  
                  {/* Image counter */}
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                    {selectedImage + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-4">
                {images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative overflow-hidden rounded-xl aspect-[3/4] transition-all duration-300 ${selectedImage === idx ? 'ring-2 ring-stone-900 shadow-lg' : 'opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`View ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:pl-8">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-light text-stone-900 mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-6">
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <p className="text-2xl font-light text-stone-400 line-through">
                    {formatPrice(product.compare_at_price)}
                  </p>
                )}
                <p className="text-3xl font-light text-stone-900">
                  {formatPrice(product.price)}
                </p>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    Save {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                  </span>
                )}
              </div>
              <p className="text-lg text-stone-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {product.colors && product.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-3">
                    Select Color
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {product.colors.map((color, idx) => {
                      const normalizedColor = normalizeColor(color);
                      
                      // Check if this color has any stock (if using stock_by_color_size)
                      let hasStock = true;
                      if (product.stock_by_color_size && typeof product.stock_by_color_size === 'object') {
                        const colorStock = product.stock_by_color_size[normalizedColor.name];
                        if (!colorStock || typeof colorStock !== 'object') {
                          hasStock = false;
                        } else {
                          // Check if any size has stock for this color
                          const totalColorStock = Object.values(colorStock).reduce((sum: number, qty: any) => sum + (qty || 0), 0);
                          hasStock = totalColorStock > 0;
                        }
                      }
                      
                      return (
                        <button
                          key={`${normalizedColor.name}-${idx}`}
                          onClick={() => hasStock && setSelectedColor(normalizedColor.name)}
                          disabled={!hasStock}
                          className={`px-4 py-2 rounded-full border-2 transition-all duration-300 ${selectedColor === normalizedColor.name
                            ? 'border-stone-900 bg-stone-100 scale-105 shadow-md'
                            : hasStock
                              ? 'border-stone-300 hover:border-stone-400'
                              : 'border-stone-200 opacity-50 cursor-not-allowed'
                            }`}
                          style={{
                            borderColor: selectedColor === normalizedColor.name ? '#1c1917' : normalizedColor.hex,
                          }}
                        >
                          <span className="flex flex-col items-start">
                            <span>{normalizedColor.name}</span>
                            {!hasStock && (
                              <span className="text-xs text-stone-400">Out of stock</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stone-900 mb-3">
                    Select Size
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {product.sizes.map((size) => {
                      // Get stock for this size based on selected color
                      let sizeStock = 0;
                      if (product.stock_by_color_size && selectedColor && typeof product.stock_by_color_size === 'object') {
                        const colorStock = product.stock_by_color_size[selectedColor];
                        if (colorStock && typeof colorStock === 'object') {
                          sizeStock = colorStock[size] || 0;
                        }
                      } else if (product.stock_by_size) {
                        sizeStock = product.stock_by_size[size] || 0;
                      } else {
                        sizeStock = product.stock || 0;
                      }
                      
                      const isOutOfStock = sizeStock === 0;

                      return (
                        <button
                          key={size}
                          onClick={() => !isOutOfStock && setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`px-6 py-3 rounded-full border-2 transition-all duration-300 font-medium relative ${selectedSize === size
                            ? 'bg-stone-900 text-white border-stone-900 shadow-lg'
                            : isOutOfStock
                              ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
                              : 'bg-white text-stone-900 border-stone-300 hover:border-stone-900'
                            }`}
                        >
                          <span className="flex flex-col items-center gap-1">
                            <span>{size}</span>
                            {isOutOfStock ? (
                              <span className="text-xs text-stone-400">Out of stock</span>
                            ) : sizeStock < 5 ? (
                              <span className={`text-xs ${selectedSize === size ? 'text-white/80' : 'text-stone-500'}`}>
                                {sizeStock} left
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-900 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full border-2 border-stone-300 hover:border-stone-900 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => {
                      const maxStock = getAvailableStockForSelection();
                      setQuantity(Math.min(maxStock, quantity + 1));
                    }}
                    disabled={quantity >= getAvailableStockForSelection()}
                    className="w-10 h-10 rounded-full border-2 border-stone-300 hover:border-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  {(() => {
                    const maxStock = getAvailableStockForSelection();
                    return maxStock > 0 && maxStock < 5 && selectedColor && selectedSize && (
                      <span className="text-sm text-stone-600 ml-2">
                        {maxStock} available
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={getAvailableStockForSelection() === 0 && !!selectedColor && !!selectedSize}
                className="flex-1 px-8 py-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {(getAvailableStockForSelection() === 0 && selectedColor && selectedSize) ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleWishlistToggle}
                className="p-4 border-2 border-stone-300 rounded-full hover:border-stone-900 hover:bg-stone-50 transition-all duration-300"
              >
                <Heart className={`w-6 h-6 ${isInWishlist() ? 'fill-red-500 text-red-500' : 'text-stone-700'}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-4 border-2 border-stone-300 rounded-full hover:border-stone-900 hover:bg-stone-50 transition-all duration-300"
              >
                <Share2 className="w-6 h-6 text-stone-700" />
              </button>
            </div>

            <div className="border-t border-stone-200 pt-8">
              <h3 className="font-medium text-stone-900 mb-4">Product Details</h3>
              <div className="space-y-2 text-stone-600">
                <p><strong>SKU:</strong> {product.sku || 'N/A'}</p>
                {selectedColor && selectedSize ? (
                  getAvailableStockForSelection() > 0 ? (
                    getAvailableStockForSelection() < 5 ? (
                      <p><strong>Availability:</strong> In Stock ({getAvailableStockForSelection()} units)</p>
                    ) : (
                      <p><strong>Availability:</strong> In Stock</p>
                    )
                  ) : (
                    <p className="text-red-600"><strong>Availability:</strong> Out of Stock</p>
                  )
                ) : (
                  <p><strong>Availability:</strong> Select color and size to check stock</p>
                )}
              </div>
            </div>

            {/* Size Chart Section */}
            <div className="border-t border-stone-200 pt-8 mt-8">
              <button
                onClick={() => setShowSizeChart(!showSizeChart)}
                className="w-full flex items-center justify-between text-left group"
              >
                <h3 className="font-medium text-stone-900">Size Chart (India)</h3>
                <span className={`text-stone-600 transition-transform duration-300 ${showSizeChart ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showSizeChart && (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-stone-100">
                        <th className="border border-stone-300 px-4 py-3 text-left font-medium">Size</th>
                        <th className="border border-stone-300 px-4 py-3 text-center font-medium">Chest (inches)</th>
                        <th className="border border-stone-300 px-4 py-3 text-center font-medium">Waist (inches)</th>
                        <th className="border border-stone-300 px-4 py-3 text-center font-medium">Length (inches)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-stone-50">
                        <td className="border border-stone-300 px-4 py-3 font-medium">XS</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">34-36</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">28-30</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">26-27</td>
                      </tr>
                      <tr className="hover:bg-stone-50">
                        <td className="border border-stone-300 px-4 py-3 font-medium">S</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">36-38</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">30-32</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">27-28</td>
                      </tr>
                      <tr className="hover:bg-stone-50">
                        <td className="border border-stone-300 px-4 py-3 font-medium">M</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">38-40</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">32-34</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">28-29</td>
                      </tr>
                      <tr className="hover:bg-stone-50">
                        <td className="border border-stone-300 px-4 py-3 font-medium">L</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">40-42</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">34-36</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">29-30</td>
                      </tr>
                      <tr className="hover:bg-stone-50">
                        <td className="border border-stone-300 px-4 py-3 font-medium">XL</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">42-44</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">36-38</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">30-31</td>
                      </tr>
                      <tr className="hover:bg-stone-50">
                        <td className="border border-stone-300 px-4 py-3 font-medium">XXL</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">44-46</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">38-40</td>
                        <td className="border border-stone-300 px-4 py-3 text-center">31-32</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-stone-500 mt-4 italic">
                    * All measurements are approximate and may vary by ±1 inch. For best fit, please measure yourself and compare with the chart.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-stone-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 mb-1">Free Shipping</p>
                  <p className="text-sm text-stone-600">On orders over {formatPrice(settings.free_shipping_threshold)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 mb-1">Easy Returns</p>
                  <p className="text-sm text-stone-600">7-day return policy</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 mb-1">Secure Payment</p>
                  <p className="text-sm text-stone-600">Protected checkout</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section>
            <h2 className="text-4xl font-light text-stone-900 mb-12 text-center">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/product/${relatedProduct.id}`} className="group">
                  <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-white mb-4 shadow-md hover:shadow-xl transition-all duration-500">
                    <img
                      src={
                        (relatedProduct.images && relatedProduct.images.length > 0) 
                          ? relatedProduct.images[0] 
                          : relatedProduct.image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600'
                      }
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-stone-900 group-hover:text-amber-700 transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-xl font-light text-stone-900">{formatPrice(relatedProduct.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
