'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { settingsService, SiteSettings } from '@/services/settings.service';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    gst_percentage: 5,
    shipping_charge: 100,
    free_shipping_threshold: 500,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setSaving(true);
      await settingsService.updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

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
        <h1 className="text-3xl md:text-4xl font-light text-stone-900 mb-2">Site Settings</h1>
        <p className="text-stone-600">Configure global store settings</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl p-4 md:p-8 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="w-6 h-6 text-stone-900" />
            <h2 className="text-2xl font-medium text-stone-900">General Settings</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  GST Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.gst_percentage}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      gst_percentage: parseFloat(e.target.value) || 0 
                    })}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="18"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500">%</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Default GST percentage applied to all orders
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Shipping Charge (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={settings.shipping_charge}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      shipping_charge: parseFloat(e.target.value) || 0 
                    })}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500">₹</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Standard shipping charge for orders
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Free Shipping Threshold (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={settings.free_shipping_threshold}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      free_shipping_threshold: parseFloat(e.target.value) || 0 
                    })}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500">₹</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Orders above this amount qualify for free shipping
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-200">
            <h3 className="font-medium text-stone-900 mb-3">Preview</h3>
            <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-600">Example Subtotal:</span>
                <span className="font-medium">₹1,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">GST ({settings.gst_percentage}%):</span>
                <span className="font-medium">₹{((1000 * settings.gst_percentage) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Shipping:</span>
                <span className="font-medium">
                  {1000 >= settings.free_shipping_threshold 
                    ? 'FREE' 
                    : `₹${settings.shipping_charge.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-300">
                <span className="font-medium text-stone-900">Total:</span>
                <span className="font-medium text-stone-900">
                  ₹{(1000 + (1000 * settings.gst_percentage) / 100 + 
                    (1000 >= settings.free_shipping_threshold ? 0 : settings.shipping_charge)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
