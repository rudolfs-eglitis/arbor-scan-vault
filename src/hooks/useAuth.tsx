import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
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

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  hasRole: (role: UserRole['role']) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: rolesData } = await supabase
        .rpc('get_user_roles', { _user_id: userId });

      console.log('Profile data:', profileData, 'Roles data:', rolesData);

      if (profileData) {
        setProfile({
          ...profileData,
          roles: rolesData?.map((r: any) => r.role) || ['user']
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set a default profile to prevent infinite loading
      setProfile({
        id: userId,
        display_name: null,
        email: '',
        avatar_url: null,
        roles: ['user']
      });
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    let loadingTimeout: NodeJS.Timeout;
    let isSubscriptionActive = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isSubscriptionActive) return; // Prevent state updates after cleanup
        
        console.log('Auth state change:', event, 'session:', !!session, 'user:', !!session?.user);
        
        // Clear any pending timeout since we got an auth state change
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User authenticated, fetching profile for:', session.user.id);
          // Defer profile fetching to avoid blocking auth state updates
          setTimeout(() => {
            if (isSubscriptionActive) {
              fetchUserProfile(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        // Always resolve loading state after auth state change
        console.log('Setting loading to false from auth state change');
        setLoading(false);
      }
    );

    // Check for existing session with better error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isSubscriptionActive) return;
      
      console.log('Initial session check:', !!session, 'user:', !!session?.user, 'error:', error);
      
      if (error) {
        console.error('Error getting initial session:', error);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          if (isSubscriptionActive) {
            fetchUserProfile(session.user.id);
          }
        }, 0);
      }
      
      console.log('Setting loading to false from initial session check');
      setLoading(false);
    }).catch((error) => {
      if (!isSubscriptionActive) return;
      console.error('Error getting initial session:', error);
      setLoading(false);
    });

    // Fallback timeout to ensure loading state always resolves
    loadingTimeout = setTimeout(() => {
      if (isSubscriptionActive) {
        console.warn('Auth loading timeout reached, resolving loading state');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => {
      isSubscriptionActive = false;
      subscription.unsubscribe();
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
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
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const hasRole = (role: UserRole['role']) => {
    return profile?.roles.includes(role) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      hasRole
    }}>
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