import { supabase } from '@/lib/supabase/client';
import { SeasonalSetting } from '@/types';

export const seasonalService = {
  // Get active seasonal setting
  async getActiveSeason(): Promise<SeasonalSetting | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('seasonal_settings')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .maybeSingle();

    if (error) {
      // Ignore AbortErrors (happens when component unmounts)
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return null;
      }
      console.error('Error fetching active season:', error.message || error);
      return null;
    }
    
    return data as SeasonalSetting | null;
  },

  // Get all seasonal settings (admin only)
  async getAllSeasons(): Promise<SeasonalSetting[]> {
    const { data, error } = await supabase
      .from('seasonal_settings')
      .select('*')
      .order('season');

    if (error) throw error;
    return (data || []) as SeasonalSetting[];
  },

  // Get season by ID
  async getSeasonById(id: string): Promise<SeasonalSetting | null> {
    const { data, error } = await supabase
      .from('seasonal_settings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as SeasonalSetting;
  },

  // Update seasonal setting (admin only)
  async updateSeason(
    id: string,
    updates: {
      animation_type?: 'snow' | 'rain' | 'leaves' | 'petals' | 'stars' | 'none';
      animation_intensity?: 'light' | 'medium' | 'heavy';
      is_active?: boolean;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<SeasonalSetting> {
    const { data, error } = await (supabase
      .from('seasonal_settings') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SeasonalSetting;
  },

  // Toggle season active status (admin only)
  async toggleSeasonStatus(id: string, isActive: boolean): Promise<SeasonalSetting> {
    return this.updateSeason(id, { is_active: isActive });
  },

  // Get current season based on date
  getCurrentSeasonName(): 'winter' | 'spring' | 'summer' | 'autumn' {
    const month = new Date().getMonth() + 1;
    
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'autumn';
  },
};
