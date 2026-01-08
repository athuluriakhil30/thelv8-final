'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/helpers';
import { productService } from '@/services/product.service';
import { settingsService, SiteSettings } from '@/services/settings.service';
import { getAvailableStock, getStockMessage, isStockAvailable } from '@/lib/cart-validation';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CartItemWithProduct {
  id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  product: Product;
}

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, loading } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const hasRedirected = useRef(false);
  const hasLoadedSettings = useRef(false);
  const [settings, setSettings] = useState<SiteSettings>({
    gst_percentage: 5,
    shipping_charge: 100,
    free_shipping_threshold: 500,
  });

  useEffect(() => {
    if (!authLoading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      toast.error('Please login to view your cart');
      router.push('/shop');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!hasLoadedSettings.current) {
      hasLoadedSettings.current = true;
      loadSettings();
    }
  }, []);

  useEffect(() => {
    if (user && !loading) {
      loadCartProducts();
    }
  }, [items, user, loading]);

  async function loadSettings() {
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function loadCartProducts() {
    if (!items || items.length === 0) {
      setCartItems([]);
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
            size: item.selected_size,
            color: item.selected_color,
          };
        })
      );
      setCartItems(itemsWithProducts);
    } catch (error) {
      console.error('Error loading cart products:', error);
      toast.error('Failed to load cart items');
    } finally {
      setLoadingProducts(false);
    }
  }

  function handleQuantityChange(itemId: string, newQuantity: number) {
    if (newQuantity < 1) return;

    // Find the item to check stock
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    // Get available stock using the validation helper
    const availableStock = getAvailableStock(
      item.product,
      item.size && item.size !== 'default' ? item.size : null
    );

    // Prevent increasing beyond available stock
    if (newQuantity > availableStock) {
      toast.error(`Only ${availableStock} available in stock`);
      return;
    }

    updateQuantity(itemId, newQuantity);
  }

  function handleRemoveItem(itemId: string) {
    removeItem(itemId);
    toast.success('Item removed from cart');
  }

  // Helper to check if any item exceeds available stock
  function hasStockIssues(): boolean {
    return cartItems.some(item => {
      const availableStock = getAvailableStock(
        item.product,
        item.size && item.size !== 'default' ? item.size : null
      );
      return item.quantity > availableStock || availableStock === 0;
    });
  }

  // Get stock issue message for an item
  function getItemStockMessage(item: CartItemWithProduct): string | null {
    const availableStock = getAvailableStock(
      item.product,
      item.size && item.size !== 'default' ? item.size : null
    );

    if (availableStock === 0) {
      return 'Out of stock';
    }

    if (item.quantity > availableStock) {
      return `Only ${availableStock} available`;
    }

    return null;
  }

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  const gst = (subtotal * settings.gst_percentage) / 100;
  const shippingCharge = subtotal >= settings.free_shipping_threshold ? 0 : settings.shipping_charge;
  const total = subtotal + gst + shippingCharge;

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
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-stone-300 mx-auto mb-6" />
            <h1 className="text-4xl font-light text-stone-900 mb-4">Your Cart is Empty</h1>
            <p className="text-xl text-stone-600 mb-8">
              Looks like you haven't added anything to your cart yet
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Continue Shopping
              <ArrowRight className="w-5 h-5" />
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
          <h1 className="text-5xl md:text-6xl font-light text-stone-900 mb-4">Shopping Cart</h1>
          <p className="text-xl text-stone-600">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        {/* Stock Issues Warning Banner */}
        {hasStockIssues() && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                !
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Stock Availability Issues</h3>
                <p className="text-sm text-red-700">
                  Some items in your cart are out of stock or have limited availability. Please review the items below and update quantities before proceeding to checkout.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-6">
                  <Link href={`/product/${item.product_id}`}>
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                      <img
                        src={item.product.image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600'}
                        alt={item.product.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Link href={`/product/${item.product_id}`}>
                          <h3 className="text-lg font-medium text-stone-900 hover:text-amber-700 transition-colors mb-2">
                            {item.product.name}
                          </h3>
                        </Link>
                        <div className="flex gap-4 text-sm text-stone-600">
                          {item.color && (
                            <span>Color: <span className="font-medium">{item.color}</span></span>
                          )}
                          {item.size && (
                            <span>Size: <span className="font-medium">{item.size}</span></span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Stock warning message */}
                    {getItemStockMessage(item) && (
                      <div className="mt-3 mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 font-medium">
                          ⚠️ {getItemStockMessage(item)}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 bg-stone-100 rounded-full p-1">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded-full bg-white hover:bg-stone-900 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-base font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={item.quantity >= getAvailableStock(item.product, item.size && item.size !== 'default' ? item.size : null)}
                          className="w-8 h-8 rounded-full bg-white hover:bg-stone-900 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-light text-stone-900">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-stone-500">
                            {formatPrice(item.product.price)} each
                          </p>
                        )}
                      </div>
                    </div>

                    {item.quantity >= item.product.stock && (
                      <p className="text-sm text-amber-600 mt-2">
                        Maximum available quantity reached
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-8 shadow-md sticky top-24">
              <h2 className="text-2xl font-medium text-stone-900 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-stone-600">Subtotal:</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">GST ({settings.gst_percentage}%):</span>
                  <span className="font-medium">{formatPrice(gst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Shipping:</span>
                  <span className="font-medium">
                    {shippingCharge === 0 ? 'FREE' : formatPrice(shippingCharge)}
                  </span>
                </div>
                {shippingCharge > 0 && (
                  <p className="text-sm text-amber-600 pt-2">
                    Add {formatPrice(settings.free_shipping_threshold - subtotal)} more for free shipping!
                  </p>
                )}
              </div>

              <div className="border-t border-stone-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-stone-900">Total:</span>
                  <span className="text-2xl font-medium text-stone-900">{formatPrice(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className={`w-full px-8 py-4 rounded-full transition-all duration-300 font-medium shadow-lg transform flex items-center justify-center gap-2 ${cartItems.some(item => item.quantity > item.product.stock)
                  ? 'bg-stone-400 text-stone-200 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-stone-800 hover:shadow-xl hover:-translate-y-1'
                  }`}
                onClick={(e) => {
                  if (cartItems.some(item => item.quantity > item.product.stock)) {
                    e.preventDefault();
                    toast.error('Please reduce quantities to match available stock before checking out');
                  }
                }}
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/shop"
                className="block text-center text-stone-600 hover:text-stone-900 mt-4 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
