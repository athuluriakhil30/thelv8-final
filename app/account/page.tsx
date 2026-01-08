'use client';

import { useEffect, useState, useRef } from 'react';
import { User, Mail, Phone, Calendar, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import { formatDate } from '@/lib/helpers';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const hasRedirected = useRef(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!authLoading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      toast.error('Please login to view your profile');
      router.push('/shop');
      return;
    }
    
    if (user && !hasLoaded.current) {
      hasLoaded.current = true;
      loadProfile();
    }
  }, [user, authLoading]);

  async function loadProfile() {
    if (!user) return;
    
    try {
      setLoading(true);
      const profileData = await authService.getProfile();
      setProfile(profileData);
      setFullName(profileData.full_name || '');
      setPhone(profileData.phone || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!fullName.trim() || !profile) {
      toast.error('Please enter your full name');
      return;
    }

    try {
      const updated = await authService.updateProfile(profile.id, {
        full_name: fullName,
        phone: phone || null,
      });
      setProfile(updated);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  }

  function handleCancel() {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
    setEditing(false);
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
      <div className="bg-white rounded-2xl p-8 shadow-md">
        <p className="text-stone-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-md">
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-3xl font-light text-stone-900">Profile Information</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-stone-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-stone-500 mb-2">Full Name</label>
            {editing ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                placeholder="Enter your full name"
              />
            ) : (
              <p className="text-lg text-stone-900">{profile?.full_name || 'Not set'}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-stone-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-stone-500 mb-2">Email</label>
            <p className="text-lg text-stone-900">{user?.email}</p>
            <p className="text-sm text-stone-500 mt-1">Email cannot be changed</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-stone-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-stone-500 mb-2">Phone Number</label>
            {editing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                placeholder="Enter your phone number"
              />
            ) : (
              <p className="text-lg text-stone-900">{profile?.phone || 'Not set'}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-stone-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-stone-500 mb-2">Member Since</label>
            <p className="text-lg text-stone-900">
              {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
            </p>
          </div>
        </div>

        {profile?.role === 'admin' && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-900 font-medium">
              🎖️ You have admin privileges
            </p>
          </div>
        )}
      </div>

      {editing && (
        <div className="flex gap-4 mt-8 pt-8 border-t border-stone-200">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
          >
            <Check className="w-5 h-5" />
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-6 py-3 bg-stone-200 text-stone-900 rounded-full hover:bg-stone-300 transition-colors font-medium"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
