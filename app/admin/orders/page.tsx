'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye, Loader2, ShoppingBag, Package } from 'lucide-react';
import { orderService } from '@/services/order.service';
import { emailClient } from '@/lib/email-client';
import { formatPrice, formatDate, formatDateTime, getOrderStatusLabel } from '@/lib/helpers';
import { ORDER_STATUSES } from '@/lib/constants';
import { toast } from 'sonner';

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);
  const [taxValue, setTaxValue] = useState(0);
  const [shippingValue, setShippingValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const ordersData = await orderService.getAllOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    try {
      await orderService.updateOrderStatus(orderId, newStatus as any);
      toast.success('Order status updated');
      
      // Send email notification via API
      try {
        await fetch('/api/orders/send-status-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, newStatus }),
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the status update if email fails
      }

      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = await orderService.getOrderById(orderId);
        setSelectedOrder(updated);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status');
    }
  }

  async function handleViewOrder(orderId: string) {
    try {
      const order = await orderService.getOrderById(orderId);
      setSelectedOrder(order);
      setTaxValue(order.tax);
      setShippingValue(order.shipping_charge);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Failed to load order details');
    }
  }

  async function handleUpdateTax() {
    if (!selectedOrder) return;
    
    try {
      const newTotal = selectedOrder.subtotal + taxValue + shippingValue;
      await orderService.updateOrder(selectedOrder.id, {
        tax: taxValue,
        total: newTotal,
      });
      toast.success('Tax updated successfully');
      setEditingTax(false);
      await loadOrders();
      const updated = await orderService.getOrderById(selectedOrder.id);
      setSelectedOrder(updated);
    } catch (error) {
      console.error('Error updating tax:', error);
      toast.error('Failed to update tax');
    }
  }

  async function handleUpdateShipping() {
    if (!selectedOrder) return;
    
    try {
      const newTotal = selectedOrder.subtotal + taxValue + shippingValue;
      await orderService.updateOrder(selectedOrder.id, {
        shipping_charge: shippingValue,
        total: newTotal,
      });
      toast.success('Shipping updated successfully');
      setEditingShipping(false);
      await loadOrders();
      const updated = await orderService.getOrderById(selectedOrder.id);
      setSelectedOrder(updated);
    } catch (error) {
      console.error('Error updating shipping:', error);
      toast.error('Failed to update shipping');
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
    completed: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-light text-stone-900 mb-2">Orders Management</h1>
        <p className="text-stone-600">{orders.length} total orders</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md">
          <p className="text-stone-600 text-xs md:text-sm mb-1">Total Orders</p>
          <p className="text-2xl md:text-3xl font-light text-stone-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md">
          <p className="text-stone-600 text-xs md:text-sm mb-1">Pending</p>
          <p className="text-2xl md:text-3xl font-light text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md">
          <p className="text-stone-600 text-xs md:text-sm mb-1">Processing</p>
          <p className="text-2xl md:text-3xl font-light text-blue-600">{stats.processing}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md">
          <p className="text-stone-600 text-xs md:text-sm mb-1">Delivered</p>
          <p className="text-2xl md:text-3xl font-light text-green-600">{stats.completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-4 border border-stone-300 rounded-lg px-4">
            <Search className="w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order number..."
              className="flex-1 py-2 border-0 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            <option value="all">All Status</option>
            {ORDER_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-stone-500">Order #</p>
                <p className="font-medium">{order.order_number}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-stone-500">Customer</p>
                <p className="font-medium truncate">{order.user_profiles?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Date</p>
                <p>{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Total</p>
                <p className="font-semibold">₹{order.total_amount?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Payment</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                  order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {order.payment_status}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleViewOrder(order.id)}
              className="w-full py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 transition-colors"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Order #</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Date</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Customer</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Total</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Payment</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-stone-700 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {paginatedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-3 md:px-6 py-3 md:py-4">
                  <p className="font-medium text-xs md:text-sm text-stone-900">{order.order_number}</p>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-stone-600">
                  {formatDateTime(order.created_at)}
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-stone-600">
                  {order.user_id}
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-stone-900">
                  {formatPrice(order.total)}
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      order.status === 'delivered' 
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {ORDER_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-stone-600 capitalize">
                    {order.payment_method === 'cod' ? 'COD' : 'Online'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600">
              {searchTerm ? 'No orders found matching your search' : 'No orders yet'}
            </p>
          </div>
        )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-200 flex items-center justify-between">
            <p className="text-sm text-stone-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white text-stone-900 border border-stone-300 rounded hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 || 
                         page === totalPages || 
                         (page >= currentPage - 2 && page <= currentPage + 2);
                })
                .map((page, index, array) => (
                  <div key={page} className="flex items-center gap-2">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-1 text-stone-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-stone-900 text-white'
                          : 'bg-white text-stone-900 border border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white text-stone-900 border border-stone-300 rounded hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-light text-stone-900 mb-2">
                    Order #{selectedOrder.order_number}
                  </h2>
                  <p className="text-stone-600">Placed on {formatDate(selectedOrder.created_at)}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-stone-50 rounded-xl p-6">
                  <h3 className="font-medium text-stone-900 mb-4">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Status:</span>
                      <span className="font-medium capitalize">{getOrderStatusLabel(selectedOrder.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Payment Method:</span>
                      <span className="font-medium capitalize">
                        {selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Payment Status:</span>
                      <span className={`font-medium ${
                        selectedOrder.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {selectedOrder.payment_status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-xl p-6">
                  <h3 className="font-medium text-stone-900 mb-4">Shipping Address</h3>
                  {selectedOrder.shipping_address ? (
                    <div className="space-y-1 text-sm">
                      <p className="font-medium text-stone-900">{selectedOrder.shipping_address.full_name}</p>
                      <p className="text-stone-600">{selectedOrder.shipping_address.address_line1 || selectedOrder.shipping_address.street_address}</p>
                      {selectedOrder.shipping_address.address_line2 && (
                        <p className="text-stone-600">{selectedOrder.shipping_address.address_line2}</p>
                      )}
                      <p className="text-stone-600">
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode}
                      </p>
                      <p className="text-stone-600">Phone: {selectedOrder.shipping_address.phone}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500">No address available</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-8">
                <div className="bg-stone-50 rounded-xl p-6">
                  <h3 className="font-medium text-stone-900 mb-4">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Subtotal:</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600">GST:</span>
                      {editingTax ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={taxValue}
                            onChange={(e) => setTaxValue(parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-stone-300 rounded text-right"
                          />
                          <button
                            onClick={handleUpdateTax}
                            className="text-green-600 hover:text-green-700 text-xs font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setTaxValue(selectedOrder.tax);
                              setEditingTax(false);
                            }}
                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{formatPrice(selectedOrder.tax)}</span>
                          <button
                            onClick={() => setEditingTax(true)}
                            className="text-stone-500 hover:text-stone-700 text-xs"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600">Shipping:</span>
                      {editingShipping ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={shippingValue}
                            onChange={(e) => setShippingValue(parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-stone-300 rounded text-right"
                          />
                          <button
                            onClick={handleUpdateShipping}
                            className="text-green-600 hover:text-green-700 text-xs font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setShippingValue(selectedOrder.shipping_charge);
                              setEditingShipping(false);
                            }}
                            className="text-red-600 hover:text-red-700 text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{selectedOrder.shipping_charge === 0 ? 'FREE' : formatPrice(selectedOrder.shipping_charge)}</span>
                          <button
                            onClick={() => setEditingShipping(true)}
                            className="text-stone-500 hover:text-stone-700 text-xs"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Discount
                          {selectedOrder.coupon_code && ` (${selectedOrder.coupon_code})`}:
                        </span>
                        <span>-{formatPrice(selectedOrder.discount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between pt-2 border-t border-stone-300">
                      <span className="font-medium text-stone-900">Total:</span>
                      <span className="font-medium text-stone-900">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-medium text-stone-900 mb-4">Order Items</h3>
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-stone-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-medium text-stone-700">Product</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-stone-700">SKU</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-stone-700">Size</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-stone-700">Color</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-stone-700">Quantity</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-stone-700">Price</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-stone-700">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item: any, index: number) => (
                          <tr key={index} className="border-t border-stone-200">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                {item.product_image && (
                                  <img 
                                    src={item.product_image} 
                                    alt={item.product_name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                )}
                                <div>
                                  <div className="font-medium text-stone-900">{item.product_name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-4 px-4 text-sm text-stone-600">
                              {item.sku || '-'}
                            </td>
                            <td className="text-center py-4 px-4 text-sm text-stone-600">
                              {item.selected_size || '-'}
                            </td>
                            <td className="text-center py-4 px-4 text-sm text-stone-600">
                              <span className="capitalize">{item.selected_color || '-'}</span>
                            </td>
                            <td className="text-center py-4 px-4 text-sm text-stone-900 font-medium">
                              {item.quantity}
                            </td>
                            <td className="text-right py-4 px-4 text-sm text-stone-900">
                              {formatPrice(item.price)}
                            </td>
                            <td className="text-right py-4 px-4 text-sm text-stone-900 font-medium">
                              {formatPrice(item.price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="font-medium text-stone-900 mb-4">Update Order Status</h3>
                <div className="flex gap-3 flex-wrap">
                  {ORDER_STATUSES.map(status => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusUpdate(selectedOrder.id, status.value)}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedOrder.status === status.value
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
