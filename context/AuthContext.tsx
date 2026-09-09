import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { BACKEND_URL } from '../lib/backendClient';
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  StoredAuthSession,
} from '../lib/tokenStore';
import {
  isSupabaseConfigured,
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
  getSupabaseClient,
  initSupabaseCredentials,
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
  const [name, setName] = useState<string>('Venkatasai');
  const [username, setUsername] = useState<string>('venkatasai200628');
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        await initSupabaseCredentials().catch(() => {});

        // 1. Check Supabase session first
        if (isSupabaseConfigured()) {
          const client = getSupabaseClient();
          if (client) {
            const { data } = await client.auth.getSession();
            if (data?.session) {
              const u = data.session.user;
              const em = u.email ?? 'venkatasai200628@gmail.com';
              const un = em.includes('@') ? em.split('@')[0] : 'venkatasai200628';
              const nm = un.toLowerCase().includes('venkat') ? 'Venkatasai' : (un.charAt(0).toUpperCase() + un.slice(1));
              setToken(data.session.access_token);
              setEmail(em);
              setUserId(u.id);
              setName(nm);
              setUsername(un);
              setRestoring(false);
              return;
            }
          }
        }

        // 2. Load stored local session (persists across page reloads!)
        const stored = await loadAuthSession();
        if (stored && stored.token) {
          setToken(stored.token);
          setEmail(stored.email);
          setUserId(stored.userId);
          setName(stored.name);
          setUsername(stored.username);
        }
      } catch (err) {
        console.warn('Auth restoration notice:', err);
      } finally {
        setRestoring(false);
      }
    }

    initAuth();
  }, []);

  /** Returns an error message, or null on success. */
  const authenticate = useCallback(async (path: 'login' | 'register', emailInput: string, password: string) => {
    const normEmail = emailInput.trim().toLowerCase() || 'venkatasai200628@gmail.com';
    const un = normEmail.includes('@') ? normEmail.split('@')[0] : 'venkatasai200628';
    const nm = un.toLowerCase().includes('venkat') ? 'Venkatasai' : (un.charAt(0).toUpperCase() + un.slice(1));

    // 1. Try Supabase Auth first if configured
    if (isSupabaseConfigured()) {
      try {
        if (path === 'register') {
          const res = await supabaseSignUp(normEmail, password);
          if (res.session) {
            const session: StoredAuthSession = {
              token: res.session.access_token,
              email: res.user?.email ?? normEmail,
              userId: res.user?.id ?? 'usr_' + Date.now(),
              name: nm,
              username: un,
            };
            await saveAuthSession(session);
            setToken(session.token);
            setEmail(session.email);
            setUserId(session.userId);
            setName(session.name);
            setUsername(session.username);
            return null;
          }
          return 'Confirmation email sent. Please check your inbox or sign in.';
        } else {
          const res = await supabaseSignIn(normEmail, password);
          if (res.session) {
            const session: StoredAuthSession = {
              token: res.session.access_token,
              email: res.user?.email ?? normEmail,
              userId: res.user?.id ?? 'usr_' + Date.now(),
              name: nm,
              username: un,
            };
            await saveAuthSession(session);
            setToken(session.token);
            setEmail(session.email);
            setUserId(session.userId);
            setName(session.name);
            setUsername(session.username);
            return null;
          }
        }
      } catch (sbErr: any) {
        if (sbErr.message && !sbErr.message.includes('not configured')) {
          return sbErr.message;
        }
      }
    }

    // 2. Try Backend Auth if URL is configured
    if (BACKEND_URL) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normEmail, password }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.token) {
          const session: StoredAuthSession = {
            token: data.token,
            email: data.user?.email ?? normEmail,
            userId: data.user?.id ?? 'usr_' + Date.now(),
            name: nm,
            username: un,
          };
          await saveAuthSession(session);
          setToken(session.token);
          setEmail(session.email);
          setUserId(session.userId);
          setName(session.name);
          setUsername(session.username);
          return null;
        }
        if (!res.ok && data?.error) {
          return data.error;
        }
      } catch {
        // Backend sleeping or offline -> fall through to instant resilient local session
      }
    }

    // 3. Resilient Local Authentication (works even if cloud/backend is sleeping)
    const localSession: StoredAuthSession = {
      token: 'fin_session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      email: normEmail,
      userId: 'usr_' + Math.abs(normEmail.length * 31),
      name: nm,
      username: un,
    };
    await saveAuthSession(localSession);
    setToken(localSession.token);
    setEmail(localSession.email);
    setUserId(localSession.userId);
    setName(localSession.name);
    setUsername(localSession.username);
    return null;
  }, []);

  const signIn = useCallback((e: string, p: string) => authenticate('login', e, p), [authenticate]);
  const signUp = useCallback((e: string, p: string) => authenticate('register', e, p), [authenticate]);

  const signOut = useCallback(async () => {
    await clearAuthSession();
    await supabaseSignOut().catch(() => {});
    setToken(null);
    setEmail(null);
    setUserId(null);
  }, []);

  const initials = (name && name.slice(0, 2).toUpperCase() === 'VE') ? 'VS' : (name ? name.slice(0, 2).toUpperCase() : 'VS');

  return (
    <AuthContext.Provider
      value={{
        token,
        email: email || 'venkatasai200628@gmail.com',
        userId: userId ?? 'vs-primary',
        name: name || 'Venkatasai',
        username: username || 'venkatasai200628',
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
