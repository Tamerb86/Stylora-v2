import { create } from 'zustand';
import { 
  supabase, 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  signInWithGitHub,
  signOut as supabaseSignOut,
  getSession,
} from '../lib/supabase';
import { api } from '../lib/api';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { UserWithPlan } from '../types';

interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  profile: UserWithPlan | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  
  // Getters
  getAccessToken: () => string | null;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
  initialized: false,

  initialize: async () => {
    // Prevent multiple initializations
    if (get().initialized) return;
    
    try {
      set({ loading: true, error: null });

      // Get current session
      const session = await getSession();
      
      if (session?.user) {
        set({ user: session.user, session });
        
        // Fetch user profile from our API
        try {
          const response = await api.getMe();
          if (response.success && response.data) {
            set({ profile: response.data });
          }
        } catch (profileError) {
          console.error('Failed to fetch profile:', profileError);
        }
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            set({ user: session.user, session });
            
            // Fetch profile from backend
            try {
              const response = await api.getMe();
              if (response.success && response.data) {
                set({ profile: response.data });
              }
            } catch (profileError) {
              console.error('Failed to fetch profile:', profileError);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, profile: null });
        } else if (event === 'USER_UPDATED') {
          if (session?.user) {
            set({ user: session.user, session });
          }
        }
      });

      // Store subscription for cleanup if needed
      // (In a real app, you might want to unsubscribe on unmount)

    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to initialize auth' });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      const { user, session } = await signInWithEmail(email, password);

      if (user && session) {
        set({ user, session });
        
        // Fetch profile
        const response = await api.getMe();
        if (response.success && response.data) {
          set({ profile: response.data });
        }
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, name?: string) => {
    try {
      set({ loading: true, error: null });

      const { user, session } = await signUpWithEmail(email, password, name);

      if (user) {
        set({ user, session });
        
        // Fetch profile (will be created by backend on first API call)
        if (session) {
          try {
            const response = await api.getMe();
            if (response.success && response.data) {
              set({ profile: response.data });
            }
          } catch (profileError) {
            console.error('Failed to fetch profile:', profileError);
          }
        }
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign up';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      await signInWithGoogle();
      // The actual sign-in happens via redirect, so we don't set user here
      // The auth state change listener will handle it after redirect
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in with Google';
      set({ error: message, loading: false });
      throw error;
    }
  },

  signInWithGitHub: async () => {
    try {
      set({ loading: true, error: null });
      await signInWithGitHub();
      // The actual sign-in happens via redirect
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in with GitHub';
      set({ error: message, loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      
      await supabaseSignOut();
      set({ user: null, session: null, profile: null });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  refreshProfile: async () => {
    try {
      const response = await api.getMe();
      if (response.success && response.data) {
        set({ profile: response.data });
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  },

  refreshSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (session) {
        set({ session, user: session.user });
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  },

  clearError: () => set({ error: null }),

  // Get current access token for API calls
  getAccessToken: () => {
    const { session } = get();
    return session?.access_token || null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const { user, session } = get();
    return !!user && !!session;
  },
}));

// Initialize auth on module load
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}
