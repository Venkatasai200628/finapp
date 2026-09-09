import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'fin.auth.token';
const USER_KEY = 'fin.auth.user';

export type StoredAuthSession = {
  token: string;
  email: string;
  userId: string;
  name: string;
  username: string;
};

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(KEY, token);
    } catch {
      /* private mode / storage disabled */
    }
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function loadToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(KEY);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export const clearAuthSession = clearToken;

export async function saveAuthSession(session: StoredAuthSession): Promise<void> {
  await saveToken(session.token);
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(session));
    } catch {}
    return;
  }
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session));
}

export async function loadAuthSession(): Promise<StoredAuthSession | null> {
  const token = await loadToken();
  if (!token) return null;

  let session: StoredAuthSession | null = null;
  if (Platform.OS === 'web') {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) session = JSON.parse(raw);
    } catch {}
  } else {
    try {
      const raw = await SecureStore.getItemAsync(USER_KEY);
      if (raw) session = JSON.parse(raw);
    } catch {}
  }

  if (session) return session;

  // Fallback defaults if token existed but user payload was missing
  return {
    token,
    email: 'venkatasai200628@gmail.com',
    userId: 'usr_venkatasai',
    name: 'Venkatasai',
    username: 'venkatasai200628',
  };
}

export async function setPersistentItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn('SecureStore setItem notice:', err);
  }
}

export async function getPersistentItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function removePersistentItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch {}
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
}
