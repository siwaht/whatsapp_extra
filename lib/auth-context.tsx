'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, Role, Permission } from '@/types/database';

interface AuthUser extends User {
  profile?: Profile & {
    role?: Role & {
      permissions?: Permission[];
    };
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        `
        *,
        role:roles (
          *,
          permissions:role_permissions (
            permission:permissions (*)
          )
        )
      `
      )
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      const formattedProfile = {
        ...profile,
        role: profile.role
          ? {
              ...profile.role,
              permissions: profile.role.permissions?.map(
                (rp: { permission: Permission }) => rp.permission
              ),
            }
          : undefined,
      };
      return formattedProfile;
    }
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const profile = await fetchUserProfile(user.id);
      if (profile) {
        setUser((prev) => (prev ? { ...prev, profile } : null));
      }
    }
  }, [user?.id, fetchUserProfile]);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        const supabase = getSupabase();

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (currentSession?.user) {
          const profile = await fetchUserProfile(currentSession.user.id);
          if (mounted) {
            setUser({ ...currentSession.user, profile: profile || undefined });
            setSession(currentSession);
          }
        }

        const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (!mounted) return;

          if (event === 'SIGNED_IN' && newSession?.user) {
            setSession(newSession);
            setUser({ ...newSession.user });
            (async () => {
              const profile = await fetchUserProfile(newSession.user.id);
              if (mounted) {
                setUser({ ...newSession.user, profile: profile || undefined });
              }
            })();
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setSession(null);
          } else if (event === 'TOKEN_REFRESHED' && newSession) {
            setSession(newSession);
          }
        });
        subscription = data.subscription;
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user?.profile?.role?.permissions) return false;
      return user.profile.role.permissions.some((p) => p.name === permission);
    },
    [user?.profile?.role?.permissions]
  );

  const hasRole = useCallback(
    (role: string) => {
      return user?.profile?.role?.name === role;
    },
    [user?.profile?.role?.name]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        hasPermission,
        hasRole,
        refreshProfile,
      }}
    >
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

export function useRequireAuth(redirectTo = '/login') {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading };
}

export function useRequirePermission(permission: string, redirectTo = '/dashboard') {
  const { user, isLoading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !hasPermission(permission)) {
      router.push(redirectTo);
    }
  }, [user, isLoading, hasPermission, permission, router, redirectTo]);

  return { user, isLoading, hasAccess: hasPermission(permission) };
}