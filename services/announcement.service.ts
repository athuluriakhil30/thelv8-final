import { supabase } from '@/lib/supabase/client';
import { Announcement } from '@/types';

export const announcementService = {
  // Get active announcement (for public display)
  async getActiveAnnouncement(): Promise<Announcement | null> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', now)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Ignore AbortErrors (happens when component unmounts)
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return null;
      }
      console.error('Error fetching active announcement:', error.message || error);
      return null;
    }
    
    return data as Announcement | null;
  },

  // Get all announcements (admin only)
  async getAllAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Announcement[];
  },

  // Get announcement by ID
  async getAnnouncementById(id: string): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Announcement;
  },

  // Create announcement (admin only)
  async createAnnouncement(announcement: {
    title: string;
    description?: string;
    content?: string;
    image_url?: string;
    button_text?: string;
    button_link?: string;
    is_active?: boolean;
    valid_from?: string;
    valid_until?: string;
  }): Promise<Announcement> {
    const { data, error } = await (supabase
      .from('announcements') as any)
      .insert({
        title: announcement.title,
        description: announcement.description || null,
        content: announcement.content || null,
        image_url: announcement.image_url || null,
        button_text: announcement.button_text || 'Got it',
        button_link: announcement.button_link || null,
        is_active: announcement.is_active ?? false,
        valid_from: announcement.valid_from || new Date().toISOString(),
        valid_until: announcement.valid_until || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Announcement;
  },

  // Update announcement (admin only)
  async updateAnnouncement(
    id: string,
    updates: {
      title?: string;
      description?: string;
      content?: string;
      image_url?: string;
      button_text?: string;
      button_link?: string;
      is_active?: boolean;
      valid_from?: string;
      valid_until?: string;
    }
  ): Promise<Announcement> {
    const { data, error } = await (supabase
      .from('announcements') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Announcement;
  },

  // Delete announcement (admin only)
  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Toggle announcement active status (admin only)
  async toggleAnnouncementStatus(id: string, isActive: boolean): Promise<Announcement> {
    return this.updateAnnouncement(id, { is_active: isActive });
  },

  // Upload announcement image
  async uploadAnnouncementImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `announcement-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `announcements/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products') // Using existing products bucket, or create a new 'announcements' bucket
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
