'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, Tag, Percent, DollarSign, Settings2 } from 'lucide-react';
import { couponService, Coupon } from '@/services/coupon.service';
import { formatPrice, formatDate } from '@/lib/helpers';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to get default dates
  const getDefaultDates = () => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    
    return {
      valid_from: now.toISOString().slice(0, 16),
      valid_until: futureDate.toISOString().slice(0, 16),
    };
  };

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    ...getDefaultDates(),
    is_active: true,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      setLoading(true);
      const data = await couponService.getAllCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    const defaultDates = getDefaultDates();
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase_amount: '',
      max_discount_amount: '',
      usage_limit: '',
      ...defaultDates,
      is_active: true,
    });
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // Validate dates
      const validFrom = new Date(formData.valid_from);
      const validUntil = new Date(formData.valid_until);
      
      if (validUntil <= validFrom) {
        toast.error('Valid Until date must be after Valid From date');
        return;
      }

      const couponData = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        is_active: formData.is_active,
      };

      if (editingId) {
        await couponService.updateCoupon(editingId, couponData);
        toast.success('Coupon updated successfully');
      } else {
        await couponService.createCoupon(couponData);
        toast.success('Coupon created successfully');
      }

      await loadCoupons();
      resetForm();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.message || 'Failed to save coupon');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await couponService.deleteCoupon(id);
      toast.success('Coupon deleted successfully');
      await loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  }

  function handleEdit(coupon: Coupon) {
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase_amount: coupon.min_purchase_amount.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      valid_from: coupon.valid_from.slice(0, 16),
      valid_until: coupon.valid_until.slice(0, 16),
      is_active: coupon.is_active,
    });
    setEditingId(coupon.id);
    setShowForm(true);
  }

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-stone-900 mb-2">Coupons Management</h1>
          <p className="text-stone-600">{coupons.length} total coupons</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add Coupon
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-4 md:p-8 shadow-md mb-8">
          <h2 className="text-xl md:text-2xl font-medium text-stone-900 mb-6">
            {editingId ? 'Edit Coupon' : 'Add New Coupon'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="SAVE20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Discount Type *
                </label>
                <select
                  required
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Minimum Purchase Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_purchase_amount}
                  onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="0"
                />
              </div>

              {formData.discount_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Max Discount Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="No limit"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Valid From *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Valid Until *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  rows={3}
                  placeholder="Optional description for internal use"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-stone-900 border-stone-300 rounded focus:ring-2 focus:ring-stone-900"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-stone-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium w-full sm:w-auto"
              >
                {editingId ? 'Update Coupon' : 'Create Coupon'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-8 py-3 bg-stone-200 text-stone-900 rounded-full hover:bg-stone-300 transition-colors font-medium w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search coupons by code or description..."
                className="flex-1 px-4 py-2 border-0 focus:outline-none"
              />
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredCoupons.map((coupon) => (
              <div key={coupon.id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-stone-400" />
                    <span className="font-bold text-lg text-stone-900">{coupon.code}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'}`}>
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-stone-500">Discount</p>
                    <p className="font-medium">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Min Purchase</p>
                    <p className="font-medium">₹{coupon.min_purchase_amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Usage</p>
                    <p className="font-medium">{coupon.used_count || 0} / {coupon.usage_limit || '∞'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Valid Until</p>
                    <p className="text-xs">{coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : 'No expiry'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="flex-1 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id)}
                    className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Code</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Discount</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Min Purchase</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Usage</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Valid Until</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-stone-700 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-stone-400" />
                          <span className="font-medium text-stone-900">{coupon.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600">
                        <div className="flex items-center gap-1">
                          {coupon.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4" />
                              {coupon.discount_value}%
                              {coupon.max_discount_amount && (
                                <span className="text-xs text-stone-400">
                                  (max ₹{coupon.max_discount_amount})
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4" />
                              {formatPrice(coupon.discount_value)}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600">
                        {formatPrice(coupon.min_purchase_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600">
                        {coupon.used_count} / {coupon.usage_limit || '∞'}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600">
                        {formatDate(coupon.valid_until)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          coupon.is_active && new Date(coupon.valid_until) > new Date()
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {coupon.is_active && new Date(coupon.valid_until) > new Date() ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/coupons/${coupon.id}/rules`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Manage Advanced Rules"
                          >
                            <Settings2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-2 text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCoupons.length === 0 && (
              <div className="text-center py-12">
                <Tag className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-600">
                  {searchTerm ? 'No coupons found matching your search' : 'No coupons yet'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
