'use client';

import { useEffect, useState } from 'react';
import { Package, ShoppingBag, Users, TrendingUp, Loader2 } from 'lucide-react';
import { productService } from '@/services/product.service';
import { orderService } from '@/services/order.service';
import { formatPrice } from '@/lib/helpers';
import Link from 'next/link';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      
      // Load products
      const productsData = await productService.getProducts();
      const products = productsData.products || [];
      
      // Load orders
      const orders = await orderService.getAllOrders();
      
      // Calculate stats (exclude refunded orders from revenue)
      const totalRevenue = orders
        .filter(order => order.status !== 'refunded')
        .reduce((sum, order) => sum + order.total, 0);
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      
      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-100 text-blue-700',
      href: '/admin/products',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'bg-green-100 text-green-700',
      href: '/admin/analytics',
    },
    {
      title: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      icon: TrendingUp,
      color: 'bg-amber-100 text-amber-700',
      href: '/admin/analytics',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ShoppingBag,
      color: 'bg-red-100 text-red-700',
      href: '/admin/orders',
    },
  ];

  return (
    <div className="pt-4">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-light text-stone-900 mb-2">Dashboard</h1>
        <p className="text-stone-600">Welcome to your admin panel</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white rounded-2xl p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
              <p className="text-stone-600 text-xs md:text-sm mb-1">{card.title}</p>
              <p className="text-2xl md:text-3xl font-light text-stone-900">{card.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md">
          <h2 className="text-lg md:text-xl font-medium text-stone-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/products"
              className="block px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-center font-medium"
            >
              Manage Products
            </Link>
            <Link
              href="/admin/orders"
              className="block px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-center font-medium"
            >
              View Orders
            </Link>
            <Link
              href="/admin/customers"
              className="block px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors text-center font-medium"
            >
              View Customers
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md">
          <h2 className="text-lg md:text-xl font-medium text-stone-900 mb-4">System Info</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-stone-200">
              <span className="text-stone-600">Total Products</span>
              <span className="font-medium text-stone-900">{stats.totalProducts}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-stone-200">
              <span className="text-stone-600">Total Orders</span>
              <span className="font-medium text-stone-900">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-stone-200">
              <span className="text-stone-600">Pending Orders</span>
              <span className="font-medium text-red-600">{stats.pendingOrders}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-stone-600">Total Revenue</span>
              <span className="font-medium text-green-600">{formatPrice(stats.totalRevenue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
