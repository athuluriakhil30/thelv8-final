'use client';

import { useEffect, useState } from 'react';
import { Search, Eye, Loader2, Users, ShieldCheck, User } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { orderService } from '@/services/order.service';
import { formatDate } from '@/lib/helpers';
import { toast } from 'sonner';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      const customersData = await authService.getAllUsers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: 'customer' | 'admin') {
    try {
      await authService.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      await loadCustomers();
      if (selectedCustomer && selectedCustomer.id === userId) {
        setSelectedCustomer({ ...selectedCustomer, role: newRole });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  }

  async function handleViewCustomer(customer: any) {
    try {
      setSelectedCustomer(customer);
      setShowModal(true);
      setLoadingOrders(true);
      const orders = await orderService.getUserOrders(customer.id);
      setCustomerOrders(orders);
    } catch (error) {
      console.error('Error loading customer orders:', error);
      toast.error('Failed to load customer orders');
    } finally {
      setLoadingOrders(false);
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      (customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (customer.phone?.includes(searchTerm) || false);
    
    const matchesRole = roleFilter === 'all' || customer.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const stats = {
    total: customers.length,
    admins: customers.filter(c => c.role === 'admin').length,
    customers: customers.filter(c => c.role === 'customer').length,
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
        <h1 className="text-3xl md:text-4xl font-light text-stone-900 mb-2">Customers Management</h1>
        <p className="text-stone-600">{customers.length} total users</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-stone-900" />
            </div>
            <div>
              <p className="text-stone-600 text-sm mb-1">Total Users</p>
              <p className="text-3xl font-light text-stone-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-stone-600 text-sm mb-1">Customers</p>
              <p className="text-3xl font-light text-blue-600">{stats.customers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-stone-600 text-sm mb-1">Admins</p>
              <p className="text-3xl font-light text-purple-600">{stats.admins}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-4 border border-stone-300 rounded-lg px-4">
            <Search className="w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="flex-1 py-2 border-0 focus:outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {paginatedCustomers.map((customer) => (
          <div key={customer.id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
            <div>
              <h3 className="font-medium text-stone-900">{customer.full_name || 'N/A'}</h3>
              <p className="text-sm text-stone-600 mt-1">{customer.email || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-stone-500">Phone</p>
                <p className="font-medium">{customer.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Role</p>
                <select
                  value={customer.role}
                  onChange={(e) => handleRoleChange(customer.id, e.target.value as 'customer' | 'admin')}
                  className={`px-2 py-1 text-xs font-medium rounded-full ${customer.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-stone-500">Joined</p>
                <p className="text-xs">{new Date(customer.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={() => handleViewCustomer(customer)}
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
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Name</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Email</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Role</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Joined</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-stone-700 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {paginatedCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-stone-900">{customer.full_name || 'N/A'}</p>
                </td>
                <td className="px-6 py-4 text-sm text-stone-600">
                  {customer.email || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-stone-600">
                  {customer.phone || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={customer.role}
                    onChange={(e) => handleRoleChange(customer.id, e.target.value as 'customer' | 'admin')}
                    className={`px-3 py-1 text-xs font-medium rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                      customer.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-stone-600">
                  {formatDate(customer.created_at)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleViewCustomer(customer)}
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
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600">
              {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-200 flex items-center justify-between">
            <p className="text-sm text-stone-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
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

      {/* Customer Details Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-light text-stone-900 mb-2">
                    {selectedCustomer.full_name || 'Customer Details'}
                  </h2>
                  <p className="text-stone-600">Member since {formatDate(selectedCustomer.created_at)}</p>
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
                  <h3 className="font-medium text-stone-900 mb-4">Contact Information</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-stone-600 block mb-1">Email:</span>
                      <span className="font-medium">{selectedCustomer.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-stone-600 block mb-1">Phone:</span>
                      <span className="font-medium">{selectedCustomer.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-stone-600 block mb-1">Role:</span>
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        selectedCustomer.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {selectedCustomer.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 rounded-xl p-6">
                  <h3 className="font-medium text-stone-900 mb-4">Account Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-stone-600 block mb-1">Total Orders:</span>
                      <span className="font-medium text-2xl">{customerOrders.length}</span>
                    </div>
                    <div>
                      <span className="text-stone-600 block mb-1">Account Status:</span>
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-medium text-stone-900 mb-4">Order History</h3>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-900" />
                  </div>
                ) : customerOrders.length > 0 ? (
                  <div className="bg-stone-50 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-stone-100 border-b border-stone-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone-700">Order #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone-700">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-stone-700">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-stone-700">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {customerOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3 text-sm font-medium text-stone-900">
                              {order.order_number}
                            </td>
                            <td className="px-4 py-3 text-sm text-stone-600">
                              {formatDate(order.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-stone-900 text-right">
                              ₹{order.total.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-stone-50 rounded-xl">
                    <p className="text-stone-600">No orders yet</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRoleChange(selectedCustomer.id, 
                      selectedCustomer.role === 'admin' ? 'customer' : 'admin'
                    )}
                    className="px-6 py-2 bg-stone-100 text-stone-700 rounded-full hover:bg-stone-200 transition-colors font-medium"
                  >
                    {selectedCustomer.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </div>
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
