import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'fin.auth.token';

/**
 * Auth tokens live in the OS keystore on device (expo-secure-store), which
 * is not implemented on web — there we fall back to localStorage. That is
 * genuinely weaker (any script on the origin can read it); acceptable for
 * the dev web build, not for a production web deployment.
 */
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
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
