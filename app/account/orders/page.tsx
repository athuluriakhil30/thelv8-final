'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Package, Eye, Loader2 } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { formatPrice, formatDate } from '@/lib/helpers';
import { getOrderStatusLabel } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Order } from '@/types';

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const hasRedirected = useRef(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!authLoading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      toast.error('Please login to view your orders');
      router.push('/shop');
      return;
    }
    
    if (user && !hasLoaded.current) {
      hasLoaded.current = true;
      loadOrders();
    }
  }, [user, authLoading]);

  async function loadOrders() {
    try {
      setLoading(true);
      const ordersData = await orderService.getMyOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-md flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-md flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-md text-center">
        <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h2 className="text-2xl font-light text-stone-900 mb-2">No Orders Yet</h2>
        <p className="text-stone-600 mb-6">You haven't placed any orders yet</p>
        <Link
          href="/shop"
          className="inline-block px-8 py-4 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-md">
        <h2 className="text-3xl font-light text-stone-900 mb-6">My Orders</h2>
        <p className="text-stone-600">You have {orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      </div>

      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-medium text-stone-900">
                  Order #{order.order_number}
                </h3>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  order.status === 'delivered' 
                    ? 'bg-green-100 text-green-700'
                    : order.status === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : order.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
              <p className="text-sm text-stone-600">
                Placed on {formatDate(order.created_at)}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-stone-500">Total Amount</p>
                <p className="text-2xl font-light text-stone-900">{formatPrice(order.total)}</p>
              </div>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-stone-500 mb-1">Payment Method</p>
              <p className="text-stone-900 font-medium capitalize">
                {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </p>
            </div>
            <div>
              <p className="text-stone-500 mb-1">Items</p>
              <p className="text-stone-900 font-medium">
                {order.order_items?.length || 0} item{order.order_items?.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div>
              <p className="text-stone-500 mb-1">Delivery</p>
              <p className="text-stone-900 font-medium">
                {order.shipping_charge === 0 ? 'Free Shipping' : formatPrice(order.shipping_charge)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
