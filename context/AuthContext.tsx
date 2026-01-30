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
        // First check if session exists and is valid
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        // If there's a session error or session is expired, clear it
        if (sessionError) {
          console.error('[AuthContext] Session error:', sessionError);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check if session is expired
        if (session) {
          const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
          const now = Date.now();
          
          if (expiresAt > 0 && now >= expiresAt) {
            console.log('[AuthContext] Session expired, clearing...');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
            setLoading(false);
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const userProfile = await authService.getUserProfile(session.user.id);
            if (!mounted) return;
            setProfile(userProfile);
            setIsAdmin(userProfile.role === 'admin');
          } catch (profileError: any) {
            console.error('[AuthContext] Error loading profile:', profileError);
            
            // If unauthorized error, clear session
            if (profileError?.code === 'PGRST301' || profileError?.message?.includes('JWT')) {
              console.log('[AuthContext] Invalid JWT, clearing session...');
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
            }
            
            if (!mounted) return;
            setProfile(null);
            setIsAdmin(false);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        // Clear auth state on any error
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
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
      async (event, session) => {
        // Ignore auth state changes when tab is not visible or during visibility transition
        if (!mounted || !isVisible.current || !shouldUpdateAuth.current) return;
        
        console.log('[AuthContext] Auth event:', event);
        
        // Skip profile fetch for INITIAL_SESSION - already handled in initializeAuth
        // But still update the session state to ensure sync
        if (event === 'INITIAL_SESSION') {
          console.log('[AuthContext] Initial session - already handled in initialization');
          setSession(session);
          setUser(session?.user ?? null);
          return;
        }
        
        // Handle token expiration
        if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthContext] Token refreshed successfully');
          setSession(session);
          setUser(session?.user ?? null);
          return; // Don't refetch profile on token refresh
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out');
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          return;
        }
        
        // Handle SIGNED_IN event
        if (event === 'SIGNED_IN') {
          console.log('[AuthContext] User signed in, fetching profile...');
        }
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const userProfile = await authService.getUserProfile(session.user.id);
            if (!mounted) return;
            setProfile(userProfile);
            setIsAdmin(userProfile.role === 'admin');
            setLoading(false); // Set loading false after profile is loaded
            console.log('[AuthContext] Profile loaded successfully');
          } catch (error: any) {
            // Ignore AbortErrors (happens when component unmounts)
            if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
              return;
            }
            
            // If JWT error, sign out
            if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
              console.log('[AuthContext] JWT error during profile fetch, signing out...');
              await supabase.auth.signOut();
              return;
            }
            
            console.error('[AuthContext] Error fetching user profile:', error?.message || error);
            if (!mounted) return;
            setProfile(null);
            setIsAdmin(false);
            setLoading(false); // Set loading false even on error
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
          setLoading(false); // Set loading false when no user
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
