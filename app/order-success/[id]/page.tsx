'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Package, Truck, Home, Loader2 } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { formatPrice, formatDate } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import type { Order } from '@/types';

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadOrder();
  }, [user, orderId, router]);

  async function loadOrder() {
    try {
      setLoading(true);
      const orderData = await orderService.getOrderById(orderId);
      if (!orderData) {
        router.push('/shop');
        return;
      }
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      router.push('/shop');
    } finally {
      setLoading(false);
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-stone-50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-4xl md:text-5xl font-light text-stone-900 mb-4">
            Order Placed Successfully!
          </h1>
          
          <p className="text-xl text-stone-600 mb-8">
            Thank you for your order. We've received your order and will start processing it soon.
          </p>

          <div className="bg-stone-50 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-stone-500 mb-1">Order Number</p>
                <p className="font-semibold text-stone-900 text-lg">{order.order_number}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">Order Date</p>
                <p className="font-medium text-stone-900">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">Total Amount</p>
                <p className="font-semibold text-stone-900 text-lg">{formatPrice(order.total)}</p>
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">Payment Method</p>
                <p className="font-medium text-stone-900 capitalize">
                  {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href={`/account/orders`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Package className="w-5 h-5" />
              View Order Details
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-stone-900 border-2 border-stone-200 rounded-full hover:border-stone-900 transition-all duration-300 font-medium"
            >
              Continue Shopping
            </Link>
          </div>

          <div className="border-t border-stone-200 pt-8">
            <h3 className="font-medium text-stone-900 mb-6">What's Next?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 mb-1">Order Confirmed</p>
                  <p className="text-sm text-stone-600">We've received your order</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 mb-1">Processing</p>
                  <p className="text-sm text-stone-600">Preparing your items</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 mb-1">Delivery</p>
                  <p className="text-sm text-stone-600">Arriving at your doorstep</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-900">
              📧 We've sent a confirmation email to your registered email address with order details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
