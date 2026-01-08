'use client';

import { useEffect, useState, useRef } from 'react';
import { MapPin, Plus, Edit2, Trash2, Star, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { addressService } from '@/services/address.service';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Address, Database } from '@/types';
import { INDIAN_STATES } from '@/types';

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const hasRedirected = useRef(false);
  const hasLoaded = useRef(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
    pincode: '',
    address_type: 'home' as 'home' | 'work' | 'other',
  });

  useEffect(() => {
    if (!authLoading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      toast.error('Please login to manage your addresses');
      router.push('/shop');
      return;
    }
    
    if (user && !hasLoaded.current) {
      hasLoaded.current = true;
      loadAddresses();
    }
  }, [user, authLoading]);

  async function loadAddresses() {
    try {
      setLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      full_name: '',
      phone: '',
      street_address: '',
      city: '',
      state: '',
      pincode: '',
      address_type: 'home',
    });
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit() {
    if (!user) return;
    
    try {
      if (editingId) {
        const updated = await addressService.updateAddress(editingId, user.id, {
          full_name: formData.full_name,
          phone: formData.phone,
          address_line1: formData.street_address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        });
        setAddresses(prev => prev.map(addr => addr.id === editingId ? updated : addr));
        toast.success('Address updated successfully');
      } else {
        const insertData: Database['public']['Tables']['addresses']['Insert'] = {
          user_id: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          address_line1: formData.street_address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          is_default: addresses.length === 0,
        };
        const created = await addressService.createAddress(insertData);
        setAddresses(prev => [...prev, created]);
        toast.success('Address added successfully');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await addressService.deleteAddress(id);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  }

  async function handleSetDefault(id: string) {
    if (!user) return;
    
    try {
      const updated = await addressService.setDefaultAddress(user.id, id);
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        is_default: addr.id === id,
      })));
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default address');
    }
  }

  function handleEdit(address: Address) {
    setFormData({
      full_name: address.full_name,
      phone: address.phone,
      street_address: address.street_address || address.address_line1,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      address_type: address.address_type || 'home',
    });
    setEditingId(address.id);
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-md flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-light text-stone-900 mb-2">Saved Addresses</h2>
            <p className="text-stone-600">Manage your delivery addresses</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Address
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-8 p-6 bg-stone-50 rounded-xl">
            <h3 className="font-medium text-stone-900 mb-4">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
              <input
                type="text"
                placeholder="Street Address *"
                value={formData.street_address}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 md:col-span-2"
              />
              <input
                type="text"
                placeholder="City *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="">Select State *</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Pincode *"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                maxLength={6}
                className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
              <select
                value={formData.address_type}
                onChange={(e) => setFormData({ ...formData, address_type: e.target.value as any })}
                className="px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                {editingId ? 'Update' : 'Save'} Address
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-stone-200 text-stone-900 rounded-full hover:bg-stone-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600">No addresses saved yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="p-6 border-2 border-stone-200 rounded-xl hover:border-stone-300 transition-colors relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-stone-100 text-stone-700 text-xs rounded-full capitalize font-medium">
                      {address.address_type}
                    </span>
                    {address.is_default && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="font-medium text-stone-900 mb-2">{address.full_name}</p>
                <p className="text-stone-600 text-sm mb-1">{address.street_address}</p>
                <p className="text-stone-600 text-sm mb-1">
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="text-stone-600 text-sm mb-4">Phone: {address.phone}</p>
                {!address.is_default && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="text-sm text-stone-700 hover:text-stone-900 font-medium"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
