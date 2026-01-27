'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { Check, CreditCard, Wallet, MapPin, Plus, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { addressService } from '@/services/address.service';
import { orderService } from '@/services/order.service';
import { productService } from '@/services/product.service';
import { settingsService, SiteSettings } from '@/services/settings.service';
import { couponService } from '@/services/coupon.service';
import { formatPrice } from '@/lib/helpers';
import { emailClient } from '@/lib/email-client';
import { PAYMENT_METHODS } from '@/lib/constants';
import { validateCartItems } from '@/lib/cart-validation';
import { INDIAN_STATES } from '@/types';
import { toast } from 'sonner';
import type { Address, Product, Database } from '@/types';

// Razorpay interface
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
    backdrop_color?: string;
    hide_topbar?: boolean;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
    confirm_close?: boolean;
  };
  retry?: {
    enabled: boolean;
    max_count: number;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CartItemWithProduct {
  id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  product: Product;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const hasCheckedAuth = useRef(false);
  const [settings, setSettings] = useState<SiteSettings>({
    gst_percentage: 5,
    shipping_charge: 100,
    free_shipping_threshold: 500,
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Address form state
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
    pincode: '',
    address_type: 'home' as 'home' | 'work' | 'other',
  });

  useEffect(() => {
    if (hasCheckedAuth.current) return;

    if (!authLoading) {
      hasCheckedAuth.current = true;

      if (!user) {
        toast.error('Please login to checkout');
        router.push('/shop');
        return;
      }

      if (items.length === 0) {
        toast.error('Your cart is empty');
        router.push('/cart');
        return;
      }

      loadCheckoutData();
    }
  }, [user, authLoading, items.length]);

  async function loadCheckoutData() {
    try {
      setLoading(true);
      const [addressesData, itemsWithProducts, settingsData] = await Promise.all([
        addressService.getAddresses(),
        Promise.all(
          items.map(async (item) => {
            const product = await productService.getProductById(item.product_id);
            return {
              ...item,
              product: product!,
              size: item.selected_size,
              color: item.selected_color,
            };
          })
        ),
        settingsService.getSettings(),
      ]);

      setAddresses(addressesData);
      setCartItems(itemsWithProducts);
      setSettings(settingsData);

      // Select default address
      const defaultAddress = addressesData.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (addressesData.length > 0) {
        setSelectedAddressId(addressesData[0].id);
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      setApplyingCoupon(true);
      const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const result = await couponService.validateCoupon(couponCode, subtotal);

      if (result.valid && result.discount) {
        setAppliedCoupon(result.coupon);
        setCouponDiscount(result.discount);
        toast.success(result.message || 'Coupon applied successfully');
      } else {
        toast.error(result.message || 'Invalid coupon');
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    toast.success('Coupon removed');
  }

  async function handleAddAddress() {
    if (!user) return;

    // Validate required fields
    if (!newAddress.full_name || !newAddress.phone || !newAddress.street_address ||
      !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const addressData: Database['public']['Tables']['addresses']['Insert'] = {
        user_id: user.id,
        full_name: newAddress.full_name,
        phone: newAddress.phone,
        address_line1: newAddress.street_address,
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.pincode,
        is_default: addresses.length === 0, // First address is default
      };

      const created = await addressService.createAddress(addressData);
      setAddresses(prev => [...prev, created]);
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
      setNewAddress({
        full_name: '',
        phone: '',
        street_address: '',
        city: '',
        state: '',
        pincode: '',
        address_type: 'home',
      });
      toast.success('Address added successfully');
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('Failed to add address');
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId || !user) {
      toast.error('Please select a delivery address');
      return;
    }

    try {
      setProcessing(true);
      setPaymentError(null); // Clear any previous payment errors

      // Validate cart stock before proceeding
      const cartValidationItems = cartItems.map(item => ({
        product_id: item.product_id,
        selected_size: item.size || null,
        quantity: item.quantity,
        product: item.product
      }));

      const stockValidation = await validateCartItems(cartValidationItems);

      if (!stockValidation.valid) {
        const issueList = stockValidation.issues.join('\n');
        toast.error(
          `Stock unavailable:\n${issueList}\nPlease update your cart.`,
          { duration: 6000 }
        );
        setProcessing(false);
        return;
      }

      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      if (!selectedAddress) {
        toast.error('Selected address not found');
        setProcessing(false);
        return;
      }

      const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const tax = (subtotal * settings.gst_percentage) / 100;
      const shippingCharge = subtotal >= settings.free_shipping_threshold ? 0 : settings.shipping_charge;
      const discount = couponDiscount;
      const total = subtotal + tax + shippingCharge - discount;

      console.log('Order calculation:', { subtotal, tax, shippingCharge, discount, total });

      // Enforce minimum order amount for Razorpay (₹1.00)
      if (paymentMethod === 'razorpay' && total < 1) {
        toast.error('Minimum order amount is ₹1 for online payment. Please add more items or use Cash on Delivery.');
        setProcessing(false);
        return;
      }

      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product.name,
        product_image: item.product.image_url || item.product.images[0] || '',
        quantity: item.quantity,
        price: item.product.price,
        selected_color: item.color || '',
        selected_size: item.size || '',
        sku: item.product.sku,
      }));

      const order = await orderService.createOrder({
        userId: user.id,
        items: orderItems,
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod,
        subtotal,
        shippingCharge,
        tax,
        discount,
        total,
        couponCode: appliedCoupon?.code || null,
      });

      if (paymentMethod === 'razorpay') {
        // Open Razorpay payment gateway
        // Email will be sent after successful payment
        await handleRazorpayPayment(order, selectedAddress);
      } else {
        // COD - send email immediately and redirect
        // Send order confirmation email asynchronously (non-blocking)
        emailClient.sendOrderConfirmation({
          to: user.email!,
          customerName: selectedAddress.full_name,
          orderNumber: order.order_number,
          orderId: order.id,
          orderDate: new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          items: orderItems.map(item => ({
            name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            size: item.selected_size || undefined,
          })),
          subtotal,
          shippingCharge,
          tax,
          discount,
          total,
          shippingAddress: {
            full_name: selectedAddress.full_name,
            phone: selectedAddress.phone,
            address_line1: selectedAddress.address_line1,
            address_line2: selectedAddress.address_line2 || undefined,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
          },
          paymentMethod: 'Cash on Delivery',
        }).catch(emailError => {
          console.error('Failed to send order confirmation email:', emailError);
        });

        await clearCart();
        router.push(`/order-success/${order.id}`);
        toast.success('Order placed successfully!');
        setProcessing(false);
      }
    } catch (error: any) {
      console.error('Error placing order:', error);

      // Parse stock validation errors to show specific products
      if (error?.message && error.message.includes('Some items are out of stock')) {
        try {
          // Extract the JSON array from the error message
          const match = error.message.match(/\[.*\]/);
          if (match) {
            const outOfStockItems = JSON.parse(match[0]);
            const itemDetails = outOfStockItems.map((item: any) => {
              const product = cartItems.find(ci => ci.product_id === item.product_id);
              const productName = product?.product?.name || 'Unknown product';
              const size = item.size ? ` (Size: ${item.size})` : '';
              return `${productName}${size} - Available: ${item.available}`;
            }).join(', ');
            
            toast.error(`Out of stock: ${itemDetails}. Please update your cart.`, {
              duration: 6000,
            });
          } else {
            toast.error('Some items are out of stock. Please refresh your cart and try again.');
          }
        } catch (parseError) {
          toast.error('Some items are out of stock. Please refresh your cart and try again.');
        }
      } else if (error?.message && error.message.includes('Insufficient stock')) {
        // Extract product details from error message
        const productMatch = error.message.match(/Insufficient stock for (size )?(.+?)\./);
        if (productMatch) {
          toast.error(`${error.message}. Please update your cart.`, {
            duration: 5000,
          });
        } else {
          toast.error('Some items do not have sufficient stock. Please reduce quantities and try again.');
        }
      } else if (error?.message && error.message.includes('Network')) {
        // Network failure during order creation
        toast.error('Network error. Please check your connection and try again.', {
          duration: 5000,
        });
      } else if (error?.message && error.message.includes('Payment gateway')) {
        // Payment gateway errors (already handled with order cancellation)
        // Error already shown via toast in the catch blocks above
        console.log('[Checkout] Payment gateway error handled');
      } else {
        // Generic error
        toast.error(error?.message || 'Failed to place order. Please try again.', {
          duration: 5000,
        });
      }

      setProcessing(false);
    }
  }

  async function handleRazorpayPayment(order: any, selectedAddress: Address) {
    try {
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Cancelling order...');
        
        // ✅ CRITICAL: Cancel the order that was just created to restore stock
        try {
          await orderService.cancelOrder(order.id, 'Payment gateway not available');
          toast.error('Payment gateway not loaded. Your cart has been restored. Please refresh and try again.', {
            duration: 6000
          });
        } catch (cancelError) {
          console.error('Failed to cancel order after gateway load failure:', cancelError);
          toast.error('Payment gateway error. Please contact support.', { duration: 8000 });
        }
        
        setProcessing(false);
        return;
      }

      // Create Razorpay order
      const razorpayOrderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total,
          currency: 'INR',
          receipt: order.order_number,
          notes: {
            order_id: order.id,
            order_number: order.order_number,
          },
        }),
      });

      if (!razorpayOrderResponse.ok) {
        const errorData = await razorpayOrderResponse.json();
        console.error('Razorpay order creation failed:', errorData);
        
        // ✅ CRITICAL: Cancel database order to restore stock
        try {
          await orderService.cancelOrder(order.id, 'Razorpay order creation failed');
          toast.error('Payment gateway error. Your cart has been restored. Please try again.', {
            duration: 6000
          });
        } catch (cancelError) {
          console.error('Failed to cancel order after Razorpay error:', cancelError);
          toast.error('Payment error. Please contact support with order #' + order.order_number, {
            duration: 8000
          });
        }
        
        setProcessing(false);
        return;
      }

      const { order: razorpayOrder } = await razorpayOrderResponse.json();

      // Update order with Razorpay order ID for webhook tracking
      try {
        // Get auth session for API request
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) {
          console.error('Failed to get session for order update:', sessionError);
          throw new Error('Authentication required');
        }

        const updateResponse = await fetch('/api/orders', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            orderId: order.id,
            notes: `Razorpay Order: ${razorpayOrder.id}${order.notes ? ' | ' + order.notes : ''}`,
            payment_id: razorpayOrder.id, // Store Razorpay order_id for webhook lookup
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error('Failed to update order:', errorData);
        }
      } catch (updateError) {
        console.error('Failed to update order with Razorpay order_id:', updateError);
        // Continue anyway, webhook will use payment notes
      }

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'The LV8',
        description: `Order #${order.order_number}`,
        order_id: razorpayOrder.id, // Use Razorpay order ID
        
        // ✅ Mobile optimizations
        modal: {
          ondismiss: async function() {
            console.log('[Checkout] User dismissed payment modal');
            
            // ✅ CRITICAL: Cancel order and restore stock when user closes modal
            try {
              await orderService.cancelOrder(order.id, 'Payment cancelled by user');
              console.log('[Checkout] Order cancelled and stock restored after modal dismissal');
              toast.info('Payment cancelled. Your cart has been restored.', { duration: 5000 });
            } catch (cancelError) {
              console.error('[Checkout] Error cancelling order after dismissal:', cancelError);
              toast.error('Payment cancelled. Please check your orders or contact support.', { duration: 6000 });
            }
            
            setProcessing(false);
            setPaymentError(null);
          },
          escape: false, // Prevent accidental closure with ESC key
          animation: true, // Smooth animations for better mobile UX
          confirm_close: true, // Ask for confirmation before closing
        },
        
        // ✅ Better error handling with retry
        retry: {
          enabled: true,
          max_count: 3,
        },
        
        handler: async function (response: any) {
          try {
            // Payment successful
            await orderService.updatePaymentStatus(
              order.id,
              'paid',
              response.razorpay_payment_id
            );

            // Send order confirmation email after successful payment
            emailClient.sendOrderConfirmation({
              to: user?.email || '',
              customerName: selectedAddress.full_name,
              orderNumber: order.order_number,
              orderId: order.id,
              orderDate: new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
              items: order.items.map((item: any) => ({
                name: item.product_name,
                quantity: item.quantity,
                price: item.price,
                size: item.selected_size || undefined,
              })),
              subtotal: order.subtotal,
              shippingCharge: order.shipping_charge,
              tax: order.tax,
              discount: order.discount,
              total: order.total,
              shippingAddress: {
                full_name: selectedAddress.full_name,
                phone: selectedAddress.phone,
                address_line1: selectedAddress.address_line1,
                address_line2: selectedAddress.address_line2 || undefined,
                city: selectedAddress.city,
                state: selectedAddress.state,
                pincode: selectedAddress.pincode,
              },
              paymentMethod: 'Online Payment',
            }).catch(emailError => {
              console.error('Failed to send order confirmation email:', emailError);
            });

            await clearCart();
            router.push(`/order-success/${order.id}`);
            toast.success('Payment successful! Order placed.');
          } catch (error) {
            console.error('Error updating payment:', error);
            toast.error('Payment received but order update failed. Contact support.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: selectedAddress?.full_name || user?.email || '',
          email: user?.email || '',
          contact: selectedAddress?.phone || '',
        },
        theme: {
          color: '#f59e0b',
          backdrop_color: 'rgba(0, 0, 0, 0.8)', // Better visibility on mobile
          hide_topbar: false, // Keep branding visible
        },
      };

      const razorpay = new window.Razorpay(options);

      // ✅ Handle any errors during Razorpay initialization
      if (!razorpay) {
        console.error('[Checkout] Failed to initialize Razorpay');
        try {
          await orderService.cancelOrder(order.id, 'Razorpay initialization failed');
          toast.error('Payment gateway error. Your cart has been restored.', { duration: 6000 });
        } catch (cancelError) {
          console.error('Failed to cancel order:', cancelError);
        }
        setProcessing(false);
        return;
      }

      razorpay.on('payment.failed', async function (response: any) {
        console.error('Payment failed:', response.error);

        // Extract error details
        const errorDetails = response.error || {};
        const errorReason = errorDetails.reason || 'unknown';
        const errorDescription = errorDetails.description || 'Payment failed';
        const errorCode = errorDetails.code || '';

        // Build user-friendly error message
        let errorMessage = 'Payment Failed: ';
        if (errorReason === 'payment_failed') {
          errorMessage += 'Your payment was declined. Please check your payment method and try again.';
        } else if (errorCode === 'BAD_REQUEST_ERROR') {
          errorMessage += errorDescription + '. Please try again or use a different payment method.';
        } else {
          errorMessage += errorDescription;
        }

        setPaymentError(errorMessage);

        // ✅ CRITICAL: Cancel the order and restore stock
        try {
          await orderService.cancelOrder(order.id, 'Payment failed: ' + errorReason);
          console.log('[Checkout] Order cancelled and stock restored after payment failure');
          toast.error(errorMessage + ' Your cart has been restored.', { duration: 6000 });
        } catch (cancelError) {
          console.error('[Checkout] Error cancelling order after payment failure:', cancelError);
          toast.error(errorMessage + ' Please contact support to restore your cart.', { duration: 8000 });
        }

        setProcessing(false);
      });

      razorpay.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      toast.error('Failed to open payment gateway');
      setProcessing(false);
    }
  }

  // Show loading state while auth is loading
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

  if (!user || items.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const gst = (subtotal * settings.gst_percentage) / 100;
  const shippingCharge = subtotal >= settings.free_shipping_threshold ? 0 : settings.shipping_charge;
  const total = subtotal + gst + shippingCharge - couponDiscount;

  return (
    <>
      {/* Load Razorpay script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="min-h-screen pt-24 pb-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-light text-stone-900 mb-4">Checkout</h1>
            <p className="text-xl text-stone-600">Complete your purchase</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Delivery Address Section */}
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-medium text-stone-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-900 text-white rounded-full flex items-center justify-center text-lg font-semibold">
                      1
                    </div>
                    Delivery Address
                  </h2>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Add New
                  </button>
                </div>

                {showAddressForm && (
                  <div className="mb-6 p-6 bg-stone-50 rounded-xl">
                    <h3 className="font-medium text-stone-900 mb-4">Add New Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={newAddress.full_name}
                        onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                        className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={newAddress.street_address}
                        onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                        className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 md:col-span-2"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                        className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                      />
                      <select
                        value={newAddress.address_type}
                        onChange={(e) => setNewAddress({ ...newAddress, address_type: e.target.value as any })}
                        className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleAddAddress}
                        className="px-6 py-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
                      >
                        Save Address
                      </button>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="px-6 py-2 bg-stone-200 text-stone-900 rounded-full hover:bg-stone-300 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 ? (
                  <p className="text-stone-600">No addresses saved. Please add a delivery address.</p>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block p-6 border-2 rounded-xl cursor-pointer transition-all ${selectedAddressId === address.id
                          ? 'border-stone-900 bg-stone-50'
                          : 'border-stone-200 hover:border-stone-300'
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={(e) => setSelectedAddressId(e.target.value)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <p className="font-medium text-stone-900 break-words">{address.full_name}</p>
                              <span className="px-3 py-1 bg-stone-200 text-stone-700 text-xs rounded-full capitalize flex-shrink-0">
                                {address.address_type}
                              </span>
                              {address.is_default && (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full flex-shrink-0">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-stone-600 break-words">{address.street_address}</p>
                            <p className="text-stone-600 break-words">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            <p className="text-stone-600 break-words">Phone: {address.phone}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method Section */}
              <div className="bg-white rounded-2xl p-8 shadow-md">
                <h2 className="text-2xl font-medium text-stone-900 flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-stone-900 text-white rounded-full flex items-center justify-center text-lg font-semibold">
                    2
                  </div>
                  Payment Method
                </h2>

                <div className="space-y-4">
                  <label
                    className={`block p-6 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'razorpay'
                      ? 'border-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                      />
                      <CreditCard className="w-6 h-6 text-stone-700" />
                      <div className="flex-1">
                        <p className="font-medium text-stone-900">Pay Online</p>
                        <p className="text-sm text-stone-600">Credit/Debit Card, UPI, Net Banking via Razorpay</p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`block p-6 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod'
                      ? 'border-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-300'
                      }`}
                  >
                    {/* <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                      />
                      <Wallet className="w-6 h-6 text-stone-700" />
                      <div className="flex-1">
                        <p className="font-medium text-stone-900">Cash on Delivery</p>
                        <p className="text-sm text-stone-600">Pay when you receive the order</p>
                      </div>
                    </div> */}
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-8 shadow-md lg:sticky lg:top-24">
                <h2 className="text-2xl font-medium text-stone-900 mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                        <img
                          src={item.product.image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600'}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 truncate">{item.product.name}</p>
                        <p className="text-sm text-stone-600">Qty: {item.quantity}</p>
                        {(item.size || item.color) && (
                          <p className="text-xs text-stone-500">
                            {item.color && `${item.color}`}
                            {item.size && item.color && ', '}
                            {item.size && `${item.size}`}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-stone-900">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-stone-200 pt-4 space-y-3 mb-6">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>GST ({settings.gst_percentage}%)</span>
                    <span>{formatPrice(gst)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Shipping</span>
                    <span>{shippingCharge === 0 ? 'FREE' : formatPrice(shippingCharge)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Section */}
                <div className="border-t border-stone-200 pt-4 mb-6">
                  <h3 className="text-sm font-medium text-stone-900 mb-3">Have a coupon?</h3>
                  {!appliedCoupon ? (
                    <div className="flex gap-2 sm:gap-3">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 min-w-0 px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                        disabled={applyingCoupon}
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="px-4 sm:px-6 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {applyingCoupon ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">{appliedCoupon.code}</span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-stone-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-medium text-stone-900">Total</span>
                    <span className="text-3xl font-light text-stone-900">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Payment Error Display - Mobile Optimized */}
                {paymentError && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-lg animate-shake">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-red-900 mb-1">Payment Failed</h4>
                        <p className="text-sm text-red-800 break-words">{paymentError}</p>
                        <div className="flex flex-wrap gap-3 mt-3">
                          <button
                            onClick={() => {
                              setPaymentError(null);
                              // User can try again by clicking Place Order
                            }}
                            className="text-sm font-medium text-red-700 hover:text-red-800 underline"
                          >
                            Try Again
                          </button>
                          <Link
                            href="/cart"
                            className="text-sm font-medium text-red-700 hover:text-red-800 underline"
                          >
                            Back to Cart
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={processing || !selectedAddressId}
                  className="w-full px-8 py-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Place Order
                    </>
                  )}
                </button>

                <p className="text-xs text-stone-500 text-center mt-4">
                  By placing an order, you agree to our Terms & Conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
