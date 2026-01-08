import { supabase } from '@/lib/supabase/client';

/**
 * Helper to get user email from user_id
 * Tries to fetch from profiles table first, then from auth
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    // Try to get email from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single<{ email: string | null }>();

    if (!profileError && profile?.email) {
      return profile.email;
    }

    // Fallback: This won't work on client side, but keeping for reference
    // In production, you'd call an API route to get this
    return null;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
}
