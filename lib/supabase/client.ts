import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'thelv8-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'x-client-info': 'thelv8-web',
    },
    fetch: (url, options = {}) => {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Helper to get current session
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Session listener for monitoring auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Validate if current session is valid and not expired
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }
    
    // Check if session is expired
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    
    if (expiresAt > 0 && now >= expiresAt) {
      console.log('[Supabase] Session expired');
      await supabase.auth.signOut();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Supabase] Error validating session:', error);
    return false;
  }
};

// Helper to safely execute authenticated queries
export const withAuth = async <T>(
  queryFn: () => Promise<T>,
  fallback?: T
): Promise<T> => {
  try {
    const isValid = await isSessionValid();
    if (!isValid && fallback !== undefined) {
      return fallback;
    }
    return await queryFn();
  } catch (error: any) {
    // Handle JWT errors
    if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
      console.log('[Supabase] JWT error, clearing session...');
      await supabase.auth.signOut();
    }
    throw error;
  }
};
