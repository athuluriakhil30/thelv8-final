import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export interface SiteSettings {
  gst_percentage: number;
  shipping_charge: number;
  free_shipping_threshold: number;
}

export const settingsService = {
  // Get all settings
  async getSettings(): Promise<SiteSettings> {
    const { data, error } = await supabase
      .from('settings' as any)
      .select('*')
      .single();

    if (error) {
      // Return defaults if no settings exist
      return {
        gst_percentage: 5,
        shipping_charge: 100,
        free_shipping_threshold: 500,
      };
    }

    return data as unknown as SiteSettings;
  },

  // Update settings
  async updateSettings(settings: Partial<SiteSettings>) {
    // Use upsert to insert or update based on unique constraint
    // This works if the settings table has a unique constraint (e.g., on id or a single row)
    const { data, error } = await supabase
      .from('settings' as any)
      .upsert(settings as any, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Upsert error:', error);
      throw new Error(error.message || 'Failed to save settings');
    }
    
    return data as unknown as SiteSettings;
  },

  // Calculate order totals based on settings
  async calculateOrderTotal(subtotal: number) {
    const settings = await this.getSettings();
    
    const tax = (subtotal * settings.gst_percentage) / 100;
    const shipping = subtotal >= settings.free_shipping_threshold ? 0 : settings.shipping_charge;
    const total = subtotal + tax + shipping;

    return {
      subtotal,
      tax,
      shipping_charge: shipping,
      total,
    };
  },
};
