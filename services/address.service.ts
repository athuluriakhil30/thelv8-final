import { supabase } from '@/lib/supabase/client';
import { Address } from '@/types';
import { Insertable, Updateable, handleSupabaseResponse } from '@/lib/supabase/types';

// Type aliases for cleaner code
type AddressInsert = Insertable<'addresses'>;
type AddressUpdate = Updateable<'addresses'>;

export const addressService = {
  // Get user's addresses
  async getAddresses(userId?: string): Promise<Address[]> {
    // If no userId provided, get current user's addresses
    if (!userId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map to include backward compatibility fields
    return (data || []).map((addr: any) => ({
      ...addr,
      street_address: addr.address_line1,
      address_type: 'home' as const,
    })) as Address[];
  },

  // Get default address
  async getDefaultAddress(userId: string) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
    return data as Address | null;
  },

  // Get address by ID
  async getAddressById(id: string) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Address;
  },

  // Create address
  async createAddress(address: AddressInsert) {
    // If this is set as default, unset other defaults
    if (address.is_default) {
      await this.unsetAllDefaults(address.user_id);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert(address)
      .select()
      .single();

    if (error) throw error;
    return data as Address;
  },

  // Update address
  async updateAddress(id: string, userId: string, updates: Partial<Address>) {
    // If this is set as default, unset other defaults
    if (updates.is_default) {
      await this.unsetAllDefaults(userId);
    }

    const updateData: AddressUpdate = updates;
    const { data, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Address;
  },

  // Delete address
  async deleteAddress(id: string) {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Set default address
  async setDefaultAddress(userId: string, addressId: string) {
    // Unset all defaults
    await this.unsetAllDefaults(userId);

    // Set new default
    const updateData: AddressUpdate = { is_default: true };
    const { data, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', addressId)
      .select()
      .single();

    if (error) throw error;
    return data as Address;
  },

  // Unset all defaults (helper)
  async unsetAllDefaults(userId: string) {
    const updateData: AddressUpdate = { is_default: false };
    const { error } = await supabase
      .from('addresses')

      .update(updateData)
      .eq('user_id', userId)
      .eq('is_default', true);

    if (error) throw error;
  },
};
