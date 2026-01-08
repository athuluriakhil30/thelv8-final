'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { productService } from '@/services/product.service';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/helpers';
import type { Order, Product } from '@/types';

interface OrderItemWithProduct {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
  product: Product;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    try {
      setLoading(true);
      const orderData = await orderService.getOrderById(orderId);
      
      if (!orderData) {
        router.push('/account/orders');
        return;
      }
      
      setOrder(orderData);

      // Load product details for each order item
      if (orderData.order_items) {
        const itemsWithProducts = await Promise.all(
          orderData.order_items.map(async (item: any) => {
            const product = await productService.getProductById(item.product_id);
            return {
              ...item,
              product: product!,
            };
          })
        );
        setOrderItems(itemsWithProducts);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      router.push('/account/orders');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-md flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="bg-white rounded-2xl p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-8 border-b border-stone-200">
          <div>
            <h1 className="text-3xl font-light text-stone-900 mb-2">
              Order #{order.order_number}
            </h1>
            <p className="text-stone-600">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <span className={`px-6 py-3 text-sm font-medium rounded-full ${
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

        {/* Order Items */}
        <div className="mb-8">
          <h2 className="text-xl font-medium text-stone-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Items
          </h2>
          <div className="space-y-4">
            {orderItems.map((item, index) => (
              <div key={`${item.product_id}-${index}`} className="flex gap-4 p-4 bg-stone-50 rounded-xl">
                <Link href={`/product/${item.product_id}`}>
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-white flex-shrink-0">
                    <img
                      src={item.product.image_url || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={item.product.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </Link>
                <div className="flex-1">
                  <Link href={`/product/${item.product_id}`}>
                    <h3 className="font-medium text-stone-900 hover:text-amber-700 transition-colors">
                      {item.product.name}
                    </h3>
                  </Link>
                  <div className="flex gap-4 text-sm text-stone-600 mt-1">
                    {item.color && <span>Color: {item.color}</span>}
                    {item.size && <span>Size: {item.size}</span>}
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-stone-900">{formatPrice(item.price * item.quantity)}</p>
                  <p className="text-sm text-stone-500">{formatPrice(item.price)} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        {order.address && (
          <div className="mb-8">
            <h2 className="text-xl font-medium text-stone-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Delivery Address
            </h2>
            <div className="p-6 bg-stone-50 rounded-xl">
              <p className="font-medium text-stone-900 mb-2">{order.address.full_name}</p>
              <p className="text-stone-600">{order.address.street_address}</p>
              <p className="text-stone-600">
                {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
              <p className="text-stone-600 mt-2">Phone: {order.address.phone}</p>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="mb-8">
          <h2 className="text-xl font-medium text-stone-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </h2>
          <div className="p-6 bg-stone-50 rounded-xl space-y-3">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>GST</span>
              <span>{formatPrice(order.gst || order.tax || 0)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Shipping</span>
              <span>{order.shipping_charge === 0 ? 'FREE' : formatPrice(order.shipping_charge)}</span>
            </div>
            <div className="flex justify-between text-lg font-medium text-stone-900 pt-3 border-t border-stone-200">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <div className="pt-3 border-t border-stone-200">
              <p className="text-sm text-stone-600">
                Payment Method: <span className="font-medium capitalize">
                  {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Order Tracking */}
        <div>
          <h2 className="text-xl font-medium text-stone-900 mb-4">Order Timeline</h2>
          <div className="space-y-4">
            <div className={`flex gap-4 ${order.status !== 'cancelled' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-stone-200 text-stone-500'
              }`}>
                ✓
              </div>
              <div>
                <p className="font-medium text-stone-900">Order Placed</p>
                <p className="text-sm text-stone-600">{formatDate(order.created_at)}</p>
              </div>
            </div>
            
            <div className={order.status === 'cancelled' ? 'opacity-50' : ''}>
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-stone-200 text-stone-500'
                }`}>
                  {['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) ? '✓' : '2'}
                </div>
                <div>
                  <p className="font-medium text-stone-900">Order Confirmed</p>
                  <p className="text-sm text-stone-600">
                    {['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) 
                      ? formatDate(order.updated_at)
                      : 'Pending confirmation'}
                  </p>
                </div>
              </div>
            </div>

            <div className={order.status === 'cancelled' ? 'opacity-50' : ''}>
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  ['shipped', 'delivered'].includes(order.status)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-stone-200 text-stone-500'
                }`}>
                  {['shipped', 'delivered'].includes(order.status) ? '✓' : '3'}
                </div>
                <div>
                  <p className="font-medium text-stone-900">Shipped</p>
                  <p className="text-sm text-stone-600">
                    {['shipped', 'delivered'].includes(order.status) 
                      ? 'Your order is on the way'
                      : 'Waiting for shipment'}
                  </p>
                </div>
              </div>
            </div>

            <div className={order.status === 'cancelled' ? 'opacity-50' : ''}>
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  order.status === 'delivered'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-stone-200 text-stone-500'
                }`}>
                  {order.status === 'delivered' ? '✓' : '4'}
                </div>
                <div>
                  <p className="font-medium text-stone-900">Delivered</p>
                  <p className="text-sm text-stone-600">
                    {order.status === 'delivered'
                      ? formatDate(order.updated_at)
                      : 'Estimated delivery in 5-7 days'}
                  </p>
                </div>
              </div>
            </div>

            {order.status === 'cancelled' && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                  ✕
                </div>
                <div>
                  <p className="font-medium text-stone-900">Order Cancelled</p>
                  <p className="text-sm text-stone-600">{formatDate(order.updated_at)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
