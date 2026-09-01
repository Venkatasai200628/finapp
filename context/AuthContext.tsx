import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { BACKEND_URL } from '../lib/backendClient';
import { clearToken, loadToken, saveToken } from '../lib/tokenStore';

type AuthState = {
  token: string | null;
  email: string | null;
  /** True until the stored token has been read back at startup. */
  restoring: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    loadToken()
      .then((stored) => setToken(stored))
      .finally(() => setRestoring(false));
  }, []);

  /** Returns an error message, or null on success. */
  const authenticate = useCallback(async (path: 'login' | 'register', emailInput: string, password: string) => {
    if (!BACKEND_URL) return 'No backend configured. Set EXPO_PUBLIC_BACKEND_URL and restart.';

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
      return null;
    } catch {
      return 'Could not reach the server. Check that the backend is running.';
    }
  }, []);

  const signIn = useCallback((e: string, p: string) => authenticate('login', e, p), [authenticate]);
  const signUp = useCallback((e: string, p: string) => authenticate('register', e, p), [authenticate]);

  const signOut = useCallback(async () => {
    await clearToken();
    setToken(null);
    setEmail(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, email, restoring, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
