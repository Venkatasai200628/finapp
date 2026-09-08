import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { BACKEND_URL } from '../lib/backendClient';
import { clearToken, loadToken, saveToken } from '../lib/tokenStore';
import {
  isSupabaseConfigured,
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
  getSupabaseClient,
} from '../lib/supabaseClient';

type AuthState = {
  token: string | null;
  email: string | null;
  userId: string | null;
  name: string;
  username: string;
  initials: string;
  restoring: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        // Check Supabase session first
        if (isSupabaseConfigured()) {
          const client = getSupabaseClient();
          if (client) {
            const { data } = await client.auth.getSession();
            if (data?.session) {
              setToken(data.session.access_token);
              setEmail(data.session.user.email ?? 'venkatasai200628@gmail.com');
              setUserId(data.session.user.id);
              setRestoring(false);
              return;
            }
          }
        }

        // Fallback to local token store
        const stored = await loadToken();
        setToken(stored);
        if (stored) {
          setEmail('venkatasai200628@gmail.com');
          setUserId('usr-venkatasai');
        }
      } finally {
        setRestoring(false);
      }
    }

    initAuth();
  }, []);

  /** Returns an error message, or null on success. */
  const authenticate = useCallback(async (path: 'login' | 'register', emailInput: string, password: string) => {
    // 1. Try Supabase Auth first if configured
    if (isSupabaseConfigured()) {
      try {
        if (path === 'register') {
          const res = await supabaseSignUp(emailInput, password);
          if (res.session) {
            setToken(res.session.access_token);
            setEmail(res.user?.email ?? emailInput);
            setUserId(res.user?.id ?? null);
            await saveToken(res.session.access_token);
            return null;
          }
          return 'Confirmation email sent. Please verify your email or sign in.';
        } else {
          const res = await supabaseSignIn(emailInput, password);
          if (res.session) {
            setToken(res.session.access_token);
            setEmail(res.user?.email ?? emailInput);
            setUserId(res.user?.id ?? null);
            await saveToken(res.session.access_token);
            return null;
          }
        }
      } catch (sbErr: any) {
        // If Supabase fails with invalid login, return message or fallback
        if (sbErr.message && !sbErr.message.includes('not configured')) {
          return sbErr.message;
        }
      }
    }

    // 2. Fallback to Backend Auth
    if (!BACKEND_URL) return 'No backend or Supabase configured. Configure database in Settings.';

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) return data?.error ?? 'Something went wrong. Try again.';

      await saveToken(data.token);
      setToken(data.token);
      setEmail(data.user?.email ?? emailInput);
      setUserId(data.user?.id ?? 'usr-local');
      return null;
    } catch {
      return 'Could not reach the server. Check that the backend is running.';
    }
  }, []);

  const signIn = useCallback((e: string, p: string) => authenticate('login', e, p), [authenticate]);
  const signUp = useCallback((e: string, p: string) => authenticate('register', e, p), [authenticate]);

  const signOut = useCallback(async () => {
    await clearToken();
    await supabaseSignOut().catch(() => {});
    setToken(null);
    setEmail(null);
    setUserId(null);
  }, []);

  // Compute clean user display details
  const displayEmail = email || 'venkatasai200628@gmail.com';
  const username = displayEmail.includes('@') ? displayEmail.split('@')[0] : 'venkatasai200628';
  const name = username.toLowerCase().includes('venkat') ? 'Venkatasai' : (username.charAt(0).toUpperCase() + username.slice(1));
  const initials = name.slice(0, 2).toUpperCase() === 'VE' ? 'VS' : name.slice(0, 2).toUpperCase();

  return (
    <AuthContext.Provider
      value={{
        token,
        email: displayEmail,
        userId: userId ?? 'vs-primary',
        name,
        username,
        initials,
        restoring,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
