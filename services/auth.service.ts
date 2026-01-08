import { supabase } from '@/lib/supabase/client';
import { User } from '@/types';
import { Tables, Updateable, handleSupabaseResponse } from '@/lib/supabase/types';
import type { AuthResponse, UserResponse, Session } from '@supabase/supabase-js';

// Type-safe profile update using generated types
type ProfileUpdate = Partial<Updateable<'profiles'>>;

export const authService = {
  // Sign up
  async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      // Handle AbortErrors gracefully
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        throw new Error('Sign up was interrupted. Please try again.');
      }
      throw error;
    }
  },

  // Sign in
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      // Handle AbortErrors gracefully
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        throw new Error('Sign in was interrupted. Please try again.');
      }
      throw error;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session
  async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Get current user
  async getCurrentUser(): Promise<UserResponse['data']['user']> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return handleSupabaseResponse(data, error) as User;
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');
    
    return this.getUserProfile(user.id);
  },

  // Update profile
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return handleSupabaseResponse(data, error) as User;
  },

  // Reset password request
  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  // Update password
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  // Check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    return profile.role === 'admin';
  },

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return handleSupabaseResponse(data, error) as User[];
  },

  // Update user role (admin only)
  async updateUserRole(userId: string, role: 'customer' | 'admin'): Promise<User> {
    const updates: ProfileUpdate = { role };
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return handleSupabaseResponse(data, error) as User;
  },
};
