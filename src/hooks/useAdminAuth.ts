import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type AdminAuthStatus =
  | 'loading'
  | 'unconfigured'
  | 'unauthenticated'
  | 'unauthorized'
  | 'authorized';

export interface AdminAuthState {
  status: AdminAuthStatus;
  user: User | null;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export function useAdminAuth(): AdminAuthState {
  const [status, setStatus] = useState<AdminAuthStatus>(() =>
    isSupabaseConfigured ? 'loading' : 'unconfigured'
  );
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const verifyAdminUser = useCallback(async (currentUser: User | null) => {
    if (!supabase) {
      setStatus('unconfigured');
      setUser(null);
      return;
    }

    if (!currentUser) {
      setUser(null);
      setStatus('unauthenticated');
      return;
    }

    setUser(currentUser);
    setStatus('loading');
    setAuthError(null);

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, user_id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        setAuthError(error.message);
        setStatus('unauthorized');
        return;
      }

      if (data && data.user_id === currentUser.id) {
        setStatus('authorized');
      } else {
        setStatus('unauthorized');
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Unable to verify administrator access.'
      );
      setStatus('unauthorized');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus('unconfigured');
      return;
    }

    let mounted = true;

    async function initAuth() {
      if (!supabase) return;
      setStatus('loading');
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;
      if (error || !data.user) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      await verifyAdminUser(data.user);
    }

    void initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      void verifyAdminUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [verifyAdminUser]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (!supabase) {
        return { error: 'Supabase is not configured.' };
      }

      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { error: error.message };
      }

      if (data.user) {
        await verifyAdminUser(data.user);
      }

      return { error: null };
    },
    [verifyAdminUser]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    setStatus('loading');
    await supabase.auth.signOut();
    setUser(null);
    setAuthError(null);
    setStatus('unauthenticated');
  }, []);

  return {
    status,
    user,
    authError,
    signIn,
    signOut,
  };
}
