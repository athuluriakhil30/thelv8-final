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
  const [showPaymentLoader, setShowPaymentLoader] = useState(false);
  const hasCheckedAuth = useRef(false);
  const paymentInProgress = useRef(false);
  const currentOrderId = useRef<string | null>(null);
  const wasVisible = useRef(true);
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

  // Handle visibility changes during payment
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      
      if (paymentInProgress.current) {
        if (!isVisible) {
          console.log('[Checkout] App hidden during payment - preserving state');
          wasVisible.current = false;
          
          // Save payment state to localStorage as backup
          if (currentOrderId.current) {
            localStorage.setItem('thelv8-pending-payment', JSON.stringify({
              orderId: currentOrderId.current,
              timestamp: Date.now(),
            }));
          }
        } else if (!wasVisible.current) {
          console.log('[Checkout] App visible again - payment still in progress');
          wasVisible.current = true;
          
          // Check if order was updated while away (webhook might have processed)
          if (currentOrderId.current) {
            checkOrderStatus(currentOrderId.current);
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Check for pending payment on mount
  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingPayment = localStorage.getItem('thelv8-pending-payment');
      if (pendingPayment && user) {
        try {
          const { orderId, timestamp } = JSON.parse(pendingPayment);
          
          // Only check if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('[Checkout] Found pending payment, checking status...');
            
            const order = await orderService.getOrderById(orderId);
            if (order && order.payment_status === 'paid') {
              console.log('[Checkout] Pending payment was successful!');
              localStorage.removeItem('thelv8-pending-payment');
              await clearCart();
              router.push(`/order-success/${orderId}`);
              toast.success('Payment successful! Order placed.');
            } else if (order && order.payment_status === 'pending') {
              // Payment still pending, show option to verify
              console.log('[Checkout] Payment still pending, order:', orderId);
              toast.info('You have a pending payment. Checking status...', { duration: 3000 });
            } else {
              // Order was cancelled or doesn't exist
              localStorage.removeItem('thelv8-pending-payment');
            }
          } else {
            // Too old, clear it
            localStorage.removeItem('thelv8-pending-payment');
          }
        } catch (error) {
          console.error('[Checkout] Error checking pending payment:', error);
          localStorage.removeItem('thelv8-pending-payment');
        }
      }
    };
    
    if (user && !authLoading) {
      checkPendingPayment();
    }
  }, [user, authLoading]);

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

  async function checkOrderStatus(orderId: string) {
    try {
      const updatedOrder = await orderService.getOrderById(orderId);
      
      if (updatedOrder && updatedOrder.payment_status === 'paid') {
        console.log('[Checkout] Order was paid while user was away!');
        paymentInProgress.current = false;
        currentOrderId.current = null;
        await clearCart();
        router.push(`/order-success/${orderId}`);
        toast.success('Payment successful! Order placed.');
      }
    } catch (error) {
      console.error('[Checkout] Error checking order status:', error);
    }
  }

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
      
      // Pass cart items for advanced rule validation
      const result = await couponService.validateCoupon(couponCode, subtotal, cartItems as any);

      if (result.valid && result.discount) {
        setAppliedCoupon(result.coupon);
        setCouponDiscount(result.discount);
        
        // Show detailed breakdown if advanced rules were applied
        if (result.appliedRules && result.appliedRules.length > 0) {
          toast.success(
            result.breakdown?.explanation || result.message || 'Coupon applied successfully',
            { duration: 5000 }
          );
        } else {
          toast.success(result.message || 'Coupon applied successfully');
        }
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

  // ✅ FIX: Add retry logic for network failures (mobile optimization)
  async function createRazorpayOrderWithRetry(orderData: any, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Checkout] Razorpay order creation attempt ${attempt}/${retries}`);
        
        const response = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });

        if (response.ok) {
          return await response.json();
        }

        // If not last attempt and got server error, retry
        if (attempt < retries && response.status >= 500) {
          const waitTime = 1000 * attempt; // Exponential backoff: 1s, 2s, 3s
          console.log(`[Checkout] Server error, retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // Non-retryable error or last attempt
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment gateway error');
      } catch (error: any) {
        // Network error - retry if not last attempt
        if (attempt < retries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
          const waitTime = 1000 * attempt;
          console.log(`[Checkout] Network error, retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Last attempt or non-network error
        throw error;
      }
    }
    throw new Error('Failed to create payment order after multiple attempts');
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

      // ✅ FIX: Enforce minimum order amount for Razorpay (must be > ₹0)
      if (paymentMethod === 'razorpay' && total <= 0) {
        toast.error('Order total must be greater than ₹0 for online payment. Please adjust your cart.');
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

      // ✅ FIX: Create Razorpay order with retry logic for network resilience
      let razorpayOrderData;
      try {
        razorpayOrderData = await createRazorpayOrderWithRetry({
          amount: order.total,
          currency: 'INR',
          receipt: order.order_number,
          notes: {
            order_id: order.id,
            order_number: order.order_number,
          },
        });
      } catch (error: any) {
        console.error('Razorpay order creation failed after retries:', error);
        
        // ✅ CRITICAL: Cancel database order to restore stock
        try {
          await orderService.cancelOrder(order.id, 'Razorpay order creation failed: ' + error.message);
          
          // Show user-friendly error based on error type
          if (error.name === 'TypeError' || error.message.includes('fetch')) {
            toast.error('Network error. Please check your connection and try again.', {
              duration: 6000
            });
          } else {
            toast.error('Payment gateway error. Your cart has been restored. Please try again.', {
              duration: 6000
            });
          }
        } catch (cancelError) {
          console.error('Failed to cancel order after Razorpay error:', cancelError);
          toast.error('Payment error. Please contact support with order #' + order.order_number, {
            duration: 8000
          });
        }
        
        setProcessing(false);
        return;
      }

      const { order: razorpayOrder } = razorpayOrderData;

      // ✅ FIX: Store razorpay_order_id for webhook reconciliation
      try {
        await orderService.updateRazorpayOrderId(order.id, razorpayOrder.id);
        console.log('[Checkout] Razorpay order ID stored:', razorpayOrder.id, 'for order:', order.id);
      } catch (updateError) {
        console.error('[Checkout] Failed to store razorpay_order_id:', updateError);
        // Non-critical - webhook can still use fallback methods
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
            
            // Clear payment tracking
            paymentInProgress.current = false;
            currentOrderId.current = null;
            
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
          setShowPaymentLoader(false);
          paymentInProgress.current = false;
          currentOrderId.current = null;
          localStorage.removeItem('thelv8-pending-payment');
          
          console.log('[Checkout] Payment handler called with:', {
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature ? 'present' : 'missing'
          });
          
          // ✅ FIX: Always redirect to success page first, then try to update
          // The webhook will handle the DB update if client-side fails
          // This ensures user ALWAYS sees success page when payment succeeds
          
          let updateSucceeded = false;
          
          try {
            // Try to update payment status (non-blocking for redirect)
            await orderService.updatePaymentStatus(
              order.id,
              'paid',
              response.razorpay_payment_id
            );
            updateSucceeded = true;
            console.log('[Checkout] Payment status updated successfully');

            // Send order confirmation email after successful payment (non-blocking)
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
          } catch (error) {
            // ✅ FIX: Don't block redirect if update fails - webhook will handle it
            console.error('[Checkout] Error updating payment status (webhook will handle):', error);
            // Continue to redirect - webhook will update the order
          }
          
          // ✅ CRITICAL: Always clear cart and redirect, even if update failed
          // Razorpay has confirmed payment, webhook will ensure DB is updated
          try {
            await clearCart();
          } catch (cartError) {
            console.error('[Checkout] Error clearing cart:', cartError);
            // Continue anyway - cart will be stale but user should see success
          }
          
          setProcessing(false);
          
          // ✅ Always redirect to success page
          toast.success('Payment successful! Order placed.');
          
          // ✅ FIX: Use multiple redirect methods for reliability
          const successUrl = `/order-success/${order.id}`;
          
          try {
            router.push(successUrl);
            
            // Fallback: If router.push doesn't navigate within 2 seconds, force redirect
            setTimeout(() => {
              if (window.location.pathname !== successUrl && !window.location.pathname.includes('order-success')) {
                console.log('[Checkout] Router.push failed, using window.location fallback');
                window.location.href = successUrl;
              }
            }, 2000);
          } catch (routerError) {
            console.error('[Checkout] Router.push failed:', routerError);
            // Immediate fallback to window.location
            window.location.href = successUrl;
          }
          
          // If client update failed, log it for debugging
          if (!updateSucceeded) {
            console.warn('[Checkout] Client update failed, relying on webhook for order:', order.id);
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
        setShowPaymentLoader(false);
        paymentInProgress.current = false;
        currentOrderId.current = null;
        
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

      // ✅ NEW: Add error boundary for Razorpay internal errors (like 500 server errors)
      // This catches errors that happen during razorpay.open() or internal API calls
      let razorpayOpened = false;
      let errorTimeout: NodeJS.Timeout | undefined;
      
      try {
        paymentInProgress.current = true;
        currentOrderId.current = order.id;
        razorpay.open();
        razorpayOpened = true;
        
        // ✅ Monitor for Razorpay 500 errors (they don't trigger payment.failed event)
        // If modal doesn't appear within 10 seconds, likely a server error occurred
        errorTimeout = setTimeout(async () => {
          if (razorpayOpened && processing) {
            console.error('[Checkout] Razorpay modal timeout - likely server error (500)');
            setShowPaymentLoader(false);
            
            // Check if order needs to be cancelled
            try {
              // Give time for any pending webhooks to arrive (in case payment actually succeeded)
              console.log('[Checkout] Waiting 5s for potential webhook...');
              await new Promise(resolve => setTimeout(resolve, 5000));
              
              // Check if webhook updated the order
              const updatedOrder = await orderService.getOrderById(order.id);
              
              if (updatedOrder && updatedOrder.payment_status === 'paid') {
                console.log('[Checkout] Payment was actually successful via webhook!');
                await clearCart();
                router.push(`/order-success/${order.id}`);
                toast.success('Payment successful! Order placed.');
              } else {
                // No webhook received, cancel order
                console.log('[Checkout] No webhook received, cancelling order');
                await orderService.cancelOrder(order.id, 'Razorpay server error (timeout)');
                toast.error('Payment gateway error (server timeout). Your cart has been restored. Please try again.', { 
                  duration: 8000 
                });
              }
            } catch (error) {
              console.error('[Checkout] Error handling timeout:', error);
              toast.error('Payment gateway error. Please check your order history or contact support.', { 
                duration: 8000 
              });
            }
            
            setProcessing(false);
          }
        }, 10000); // 10 second timeout
      } catch (openError) {
        console.error('[Checkout] Error opening Razorpay modal:', openError);
        razorpayOpened = false;
        if (errorTimeout) clearTimeout(errorTimeout);
        setShowPaymentLoader(false);
        
        try {
          await orderService.cancelOrder(order.id, 'Razorpay modal open error');
          toast.error('Failed to open payment gateway. Your cart has been restored.', { duration: 6000 });
        } catch (cancelError) {
          console.error('[Checkout] Error cancelling order after modal error:', cancelError);
          toast.error('Payment gateway error. Please contact support.', { duration: 8000 });
        }
        
        setProcessing(false);
      }
      
      // Hide loader after a short delay (modal takes ~200ms to appear)
      setTimeout(() => {
        setShowPaymentLoader(false);
      }, 300);
    } catch (error) {
      console.error('Razorpay error:', error);
      setShowPaymentLoader(false);
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

      {/* Full-screen payment loading overlay */}
      {showPaymentLoader && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center">
            <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-medium text-stone-900 mb-2">Opening Payment Gateway</h3>
            <p className="text-stone-600 text-sm">Please wait while we securely process your order...</p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-500">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secure Payment
            </div>
          </div>
        </div>
      )}

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
