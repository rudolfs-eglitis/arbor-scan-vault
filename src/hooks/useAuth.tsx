import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  role: 'admin' | 'qtra_arborist' | 'certified_arborist' | 'user';
}

interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  roles: UserRole['role'][];
}

interface AuthDebugInfo {
  lastEvent: string;
  lastError: string | null;
  sessionStatus: string;
  oauthAttempts: number;
  popupStatus: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  debugInfo: AuthDebugInfo;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  hasRole: (role: UserRole['role']) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Enhanced logging utility
const authLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH ${timestamp}] ${message}`, data || '');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo>({
    lastEvent: 'initializing',
    lastError: null,
    sessionStatus: 'unknown',
    oauthAttempts: 0,
    popupStatus: null
  });

  const updateDebugInfo = useCallback((updates: Partial<AuthDebugInfo>) => {
    setDebugInfo(prev => ({ ...prev, ...updates }));
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      authLog('Fetching profile for user', { userId });
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        authLog('Profile fetch error', profileError);
        throw profileError;
      }

      const { data: rolesData, error: rolesError } = await supabase
        .rpc('get_user_roles', { _user_id: userId });

      if (rolesError) {
        authLog('Roles fetch error', rolesError);
      }

      authLog('Profile data fetched', { profileData, rolesData });

      if (profileData) {
        const userProfile: UserProfile = {
          ...profileData,
          roles: rolesData?.map((r: any) => r.role) || ['user']
        };
        setProfile(userProfile);
        updateDebugInfo({ lastEvent: 'profile_loaded' });
      }
    } catch (error) {
      authLog('Error fetching user profile', error);
      updateDebugInfo({ 
        lastError: `Profile fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      
      // Set minimal profile to prevent infinite loading
      setProfile({
        id: userId,
        display_name: null,
        email: user?.email || '',
        avatar_url: null,
        roles: ['user']
      });
    }
  }, [user, updateDebugInfo]);

  useEffect(() => {
    authLog('Setting up enhanced auth state listener');
    let isSubscriptionActive = true;
    let loadingTimeout: NodeJS.Timeout;
    
    updateDebugInfo({ lastEvent: 'auth_listener_setup' });
    
    // Enhanced auth state listener with comprehensive logging
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isSubscriptionActive) {
          authLog('Subscription inactive, ignoring auth state change');
          return;
        }
        
        authLog('Auth state change detected', { event, hasSession: !!session, hasUser: !!session?.user });
        
        // Clear loading timeout
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
        
        updateDebugInfo({ 
          lastEvent: `auth_${event}`,
          sessionStatus: session ? 'active' : 'none'
        });
        
        // Update session and user state
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          authLog('User authenticated, scheduling profile fetch');
          // Use setTimeout to avoid blocking auth state updates
          setTimeout(() => {
            if (isSubscriptionActive) {
              fetchUserProfile(session.user.id);
            }
          }, 50);
        } else {
          authLog('No user in session, clearing profile');
          setProfile(null);
        }
        
        // Always resolve loading state
        authLog('Resolving loading state');
        setLoading(false);
      }
    );

    // Enhanced initial session check
    const initializeAuth = async () => {
      try {
        authLog('Checking for existing session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isSubscriptionActive) return;
        
        if (error) {
          authLog('Error getting initial session', error);
          updateDebugInfo({ 
            lastError: `Session check failed: ${error.message}`,
            sessionStatus: 'error'
          });
          setLoading(false);
          return;
        }
        
        authLog('Initial session check complete', { hasSession: !!session });
        updateDebugInfo({ 
          lastEvent: 'initial_session_check',
          sessionStatus: session ? 'active' : 'none'
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            if (isSubscriptionActive) {
              fetchUserProfile(session.user.id);
            }
          }, 50);
        }
        
        setLoading(false);
      } catch (error) {
        if (!isSubscriptionActive) return;
        
        authLog('Unexpected error during auth initialization', error);
        updateDebugInfo({ 
          lastError: `Auth init failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        setLoading(false);
      }
    };

    initializeAuth();

    // Fallback timeout with enhanced logging
    loadingTimeout = setTimeout(() => {
      if (isSubscriptionActive) {
        authLog('Auth loading timeout reached - forcing resolution');
        updateDebugInfo({ 
          lastEvent: 'loading_timeout',
          lastError: 'Auth initialization timed out after 15 seconds'
        });
        setLoading(false);
      }
    }, 15000);

    return () => {
      authLog('Cleaning up auth subscription');
      isSubscriptionActive = false;
      subscription.unsubscribe();
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [fetchUserProfile, updateDebugInfo]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    authLog('Sign up attempt', { email, hasDisplayName: !!displayName });
    updateDebugInfo({ lastEvent: 'signup_attempt' });
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });
    
    if (error) {
      authLog('Sign up error', error);
      updateDebugInfo({ lastError: `Signup failed: ${error.message}` });
    } else {
      authLog('Sign up successful');
      updateDebugInfo({ lastEvent: 'signup_success', lastError: null });
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    authLog('Sign in attempt', { email });
    updateDebugInfo({ lastEvent: 'signin_attempt' });
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      authLog('Sign in error', error);
      updateDebugInfo({ lastError: `Signin failed: ${error.message}` });
    } else {
      authLog('Sign in successful');
      updateDebugInfo({ lastEvent: 'signin_success', lastError: null });
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    authLog('Google OAuth attempt starting');
    updateDebugInfo({ 
      lastEvent: 'google_oauth_attempt',
      oauthAttempts: debugInfo.oauthAttempts + 1,
      popupStatus: 'opening'
    });

    try {
      // Enhanced popup-based OAuth with better error handling
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false
        }
      });

      if (error) {
        authLog('Google OAuth error', error);
        updateDebugInfo({ 
          lastError: `Google OAuth failed: ${error.message}`,
          popupStatus: 'error'
        });
        return { error };
      }

      authLog('Google OAuth initiated successfully', data);
      updateDebugInfo({ 
        lastEvent: 'google_oauth_initiated',
        popupStatus: 'redirecting',
        lastError: null
      });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown OAuth error';
      authLog('Unexpected Google OAuth error', error);
      updateDebugInfo({ 
        lastError: `OAuth exception: ${errorMessage}`,
        popupStatus: 'failed'
      });
      
      return { 
        error: { 
          message: errorMessage,
          status: 500 
        } as AuthError 
      };
    }
  };

  const signOut = async () => {
    authLog('Sign out attempt');
    updateDebugInfo({ lastEvent: 'signout_attempt' });
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      authLog('Sign out error', error);
      updateDebugInfo({ lastError: `Signout failed: ${error.message}` });
    } else {
      authLog('Sign out successful');
      updateDebugInfo({ 
        lastEvent: 'signout_success', 
        lastError: null,
        sessionStatus: 'none'
      });
    }
    
    return { error };
  };

  const hasRole = (role: UserRole['role']) => {
    return profile?.roles.includes(role) || false;
  };

  const clearError = () => {
    updateDebugInfo({ lastError: null });
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    debugInfo,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    hasRole,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}