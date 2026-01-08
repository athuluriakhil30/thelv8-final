'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, onAuthStateChange } from '@/lib/supabase/client';
import { User } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthContextType {
  user: SupabaseUser | null;
  profile: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isVisible = useRef(true);
  const shouldUpdateAuth = useRef(true);

  useEffect(() => {
    let mounted = true;
    
    // Track visibility to prevent updates when tab is hidden
    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;
      // Don't trigger any auth checks when becoming visible
      if (isVisible.current) {
        shouldUpdateAuth.current = false;
        setTimeout(() => {
          shouldUpdateAuth.current = true;
        }, 100);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const userProfile = await authService.getUserProfile(session.user.id);
            if (!mounted) return;
            setProfile(userProfile);
            setIsAdmin(userProfile.role === 'admin');
          } catch (profileError) {
            console.error('[AuthContext] Error loading profile:', profileError);
            if (!mounted) return;
            setProfile(null);
            setIsAdmin(false);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Note: Token refresh is now handled automatically by Supabase
    // No manual refresh needed anymore

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Ignore auth state changes when tab is not visible or during visibility transition
        if (!mounted || !isVisible.current || !shouldUpdateAuth.current) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const userProfile = await authService.getUserProfile(session.user.id);
            if (!mounted) return;
            setProfile(userProfile);
            setIsAdmin(userProfile.role === 'admin');
          } catch (error: any) {
            // Ignore AbortErrors (happens when component unmounts)
            if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
              return;
            }
            console.error('Error fetching user profile:', error?.message || error);
            if (!mounted) return;
            setProfile(null);
            setIsAdmin(false);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data } = await authService.signIn(email, password);
    const user = data.user;
    if (user) {
      const userProfile = await authService.getUserProfile(user.id);
      setProfile(userProfile);
      setIsAdmin(userProfile.role === 'admin');
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    await authService.signUp(email, password, fullName);
  };

  const signOut = async () => {
    await authService.signOut();
    setProfile(null);
    setIsAdmin(false);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
