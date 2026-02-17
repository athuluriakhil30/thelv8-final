'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Package, ShoppingCart, XCircle, CheckCircle, IndianRupee, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { orderService } from '@/services/order.service';
import { Order } from '@/types';
import { formatPrice, formatDate } from '@/lib/helpers';

interface OrderStats {
  totalOrders: number;
  confirmedOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  failedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface ProductSales {
  productName: string;
  quantity: number;
  revenue: number;
  orders: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    confirmedOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    refundedOrders: 0,
    failedOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const ordersData = await orderService.getAllOrders();
      setOrders(ordersData);

      // Calculate order statistics
      const orderStats: OrderStats = {
        totalOrders: ordersData.length,
        confirmedOrders: ordersData.filter(o => o.status === 'confirmed').length,
        pendingOrders: ordersData.filter(o => o.status === 'pending').length,
        processingOrders: ordersData.filter(o => o.status === 'processing').length,
        shippedOrders: ordersData.filter(o => o.status === 'shipped').length,
        deliveredOrders: ordersData.filter(o => o.status === 'delivered').length,
        cancelledOrders: ordersData.filter(o => o.status === 'cancelled').length,
        refundedOrders: ordersData.filter(o => o.status === 'refunded').length,
        failedOrders: ordersData.filter(o => o.payment_status === 'failed').length,
        totalRevenue: ordersData
          .filter(o => o.status !== 'cancelled' && o.status !== 'refunded' && o.payment_status === 'paid')
          .reduce((sum, o) => sum + o.total, 0),
        averageOrderValue: 0,
      };

      orderStats.averageOrderValue = orderStats.totalOrders > 0 
        ? orderStats.totalRevenue / orderStats.totalOrders 
        : 0;

      setStats(orderStats);

      // Calculate top products
      const productMap = new Map<string, ProductSales>();
      ordersData
        .filter(o => o.status !== 'cancelled' && o.status !== 'refunded' && o.payment_status === 'paid')
        .forEach(order => {
          order.items.forEach(item => {
            const existing = productMap.get(item.product_name);
            if (existing) {
              existing.quantity += item.quantity;
              existing.revenue += item.price * item.quantity;
              existing.orders += 1;
            } else {
              productMap.set(item.product_name, {
                productName: item.product_name,
                quantity: item.quantity,
                revenue: item.price * item.quantity,
                orders: 1,
              });
            }
          });
        });

      const topProductsData = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
      setTopProducts(topProductsData);

      // Calculate daily revenue (last 30 days)
      const dailyMap = new Map<string, { revenue: number; orders: number }>();
      const last30Days = ordersData.filter(o => {
        const orderDate = new Date(o.created_at);
        const daysDiff = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30 && o.status !== 'cancelled' && o.status !== 'refunded' && o.payment_status === 'paid';
      });

      last30Days.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const existing = dailyMap.get(date);
        if (existing) {
          existing.revenue += order.total;
          existing.orders += 1;
        } else {
          dailyMap.set(date, { revenue: order.total, orders: 1 });
        }
      });

      const dailyRevenueData = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(-30);

      setDailyRevenue(dailyRevenueData);
    } catch (error) {
      console.error('Error loading analytics:', error);
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

  const orderStatusData = [
    { name: 'Confirmed', value: stats.confirmedOrders, color: '#22c55e' },
    { name: 'Processing', value: stats.processingOrders, color: '#3b82f6' },
    { name: 'Shipped', value: stats.shippedOrders, color: '#f59e0b' },
    { name: 'Delivered', value: stats.deliveredOrders, color: '#8b5cf6' },
    { name: 'Pending', value: stats.pendingOrders, color: '#6366f1' },
    { name: 'Cancelled', value: stats.cancelledOrders, color: '#ef4444' },
    { name: 'Refunded', value: stats.refundedOrders, color: '#ec4899' },
  ].filter(item => item.value > 0);

  const successRate = stats.totalOrders > 0 
    ? ((stats.confirmedOrders + stats.processingOrders + stats.shippedOrders + stats.deliveredOrders) / stats.totalOrders * 100).toFixed(1)
    : 0;

  const failureRate = stats.totalOrders > 0
    ? ((stats.cancelledOrders + stats.refundedOrders + stats.failedOrders) / stats.totalOrders * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Analytics Dashboard</h1>
            <p className="text-stone-600 mt-1">Comprehensive insights into your store performance</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.totalOrders}</div>
            <p className="text-xs text-green-600 mt-1">All time orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{successRate}%</div>
            <p className="text-xs text-blue-600 mt-1">Successful orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-amber-600 mt-1">Excluding cancelled/refunded</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{formatPrice(stats.averageOrderValue)}</div>
            <p className="text-xs text-purple-600 mt-1">Per order average</p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Breakdown of orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{stats.confirmedOrders}</div>
                <div className="text-xs text-green-600 mt-1">Confirmed Orders</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-700">{stats.cancelledOrders + stats.refundedOrders}</div>
                <div className="text-xs text-red-600 mt-1">Cancelled/Refunded</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Details</CardTitle>
            <CardDescription>Detailed count by each status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Confirmed</span>
                </div>
                <span className="text-xl font-bold text-green-700">{stats.confirmedOrders}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Processing</span>
                </div>
                <span className="text-xl font-bold text-blue-700">{stats.processingOrders}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-900">Shipped</span>
                </div>
                <span className="text-xl font-bold text-amber-700">{stats.shippedOrders}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Delivered</span>
                </div>
                <span className="text-xl font-bold text-purple-700">{stats.deliveredOrders}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-stone-600" />
                  <span className="font-medium text-stone-900">Pending</span>
                </div>
                <span className="text-xl font-bold text-stone-700">{stats.pendingOrders}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">Cancelled</span>
                </div>
                <span className="text-xl font-bold text-red-700">{stats.cancelledOrders}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-200">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-pink-600" />
                  <span className="font-medium text-pink-900">Refunded</span>
                </div>
                <span className="text-xl font-bold text-pink-700">{stats.refundedOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends (Last 30 Days)</CardTitle>
          <CardDescription>Daily revenue and order count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'revenue') return formatPrice(value);
                    return value;
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  name="Revenue (₹)" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  name="Orders" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Best Selling Products</CardTitle>
          <CardDescription>Products by quantity sold</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="chart">Chart View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="mt-6">
              <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="productName" type="category" width={150} />
                    <Tooltip 
                      formatter={(value: any, name: string) => {
                        if (name === 'revenue') return formatPrice(value);
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="quantity" fill="#3b82f6" name="Quantity Sold" />
                    <Bar dataKey="revenue" fill="#22c55e" name="Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="table" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Rank</th>
                      <th className="text-left p-3 font-semibold">Product Name</th>
                      <th className="text-right p-3 font-semibold">Quantity Sold</th>
                      <th className="text-right p-3 font-semibold">Revenue</th>
                      <th className="text-right p-3 font-semibold">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((product, index) => (
                      <tr key={product.productName} className="border-b hover:bg-stone-50">
                        <td className="p-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-700' :
                            index === 1 ? 'bg-stone-100 text-stone-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-stone-50 text-stone-600'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="p-3 font-medium">{product.productName}</td>
                        <td className="p-3 text-right font-semibold">{product.quantity}</td>
                        <td className="p-3 text-right font-semibold text-green-600">
                          {formatPrice(product.revenue)}
                        </td>
                        <td className="p-3 text-right text-stone-600">{product.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Successful Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900">
              {orders.filter(o => o.payment_status === 'paid').length}
            </div>
            <p className="text-sm text-green-700 mt-2">
              {formatPrice(orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0))}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-900">
              {orders.filter(o => o.payment_status === 'pending').length}
            </div>
            <p className="text-sm text-amber-700 mt-2">
              {formatPrice(orders.filter(o => o.payment_status === 'pending').reduce((sum, o) => sum + o.total, 0))}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Failed Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-900">
              {stats.failedOrders}
            </div>
            <p className="text-sm text-red-700 mt-2">
              {failureRate}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
