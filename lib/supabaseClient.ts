import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { ParsedStatementRow } from './bankStatementParser';

const URL_KEY = 'fin.supabase.url';
const KEY_KEY = 'fin.supabase.anon_key';

let cachedClient: SupabaseClient | null = null;
let currentUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
let currentKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export async function initSupabaseCredentials() {
  if (Platform.OS === 'web') {
    try {
      const storedUrl = localStorage.getItem(URL_KEY);
      const storedKey = localStorage.getItem(KEY_KEY);
      if (storedUrl) currentUrl = storedUrl;
      if (storedKey) currentKey = storedKey;
    } catch {}
  } else {
    try {
      const storedUrl = await SecureStore.getItemAsync(URL_KEY);
      const storedKey = await SecureStore.getItemAsync(KEY_KEY);
      if (storedUrl) currentUrl = storedUrl;
      if (storedKey) currentKey = storedKey;
    } catch {}
  }
  return { url: currentUrl, anonKey: currentKey };
}

initSupabaseCredentials().catch(() => {});

export async function saveSupabaseCredentials(url: string, anonKey: string) {
  currentUrl = url.trim();
  currentKey = anonKey.trim();
  cachedClient = null;

  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(URL_KEY, currentUrl);
      localStorage.setItem(KEY_KEY, currentKey);
    } catch {}
  } else {
    try {
      await SecureStore.setItemAsync(URL_KEY, currentUrl);
      await SecureStore.setItemAsync(KEY_KEY, currentKey);
    } catch {}
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(currentUrl && currentKey);
}

export function getSupabaseCredentials() {
  return { url: currentUrl, anonKey: currentKey };
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!currentUrl || !currentKey) return null;
  if (!cachedClient) {
    cachedClient = createClient(currentUrl, currentKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }
  return cachedClient;
}

export async function supabaseSignUp(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase credentials are not configured yet.');
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function supabaseSignIn(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase credentials are not configured yet.');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function supabaseSignOut() {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut().catch(() => {});
  }
}

export async function supabaseSaveStatements(userId: string, rows: ParsedStatementRow[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !userId || rows.length === 0) return false;
  try {
    const payload = rows.map((r) => ({
      id: r.id,
      user_id: userId,
      merchant: r.merchant,
      category: r.category,
      amount: r.amount,
      date_raw: String((r as any).date || r.dateLabel || ''),
      date_label: r.dateLabel,
      description: r.rawDescription,
      upi_id: (r as any).upiId || null,
      bank_ref: (r as any).bankRef || null,
    }));

    const { error } = await client.from('fin_statements').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase statements sync note:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save statements error:', err);
    return false;
  }
}

export async function supabaseLoadStatements(userId: string): Promise<ParsedStatementRow[]> {
  const client = getSupabaseClient();
  if (!client || !userId) return [];
  try {
    const { data, error } = await client
      .from('fin_statements')
      .select('*')
      .eq('user_id', userId)
      .order('date_raw', { ascending: false });

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      dateRaw: d.date_raw,
      dateLabel: d.date_label,
      merchant: d.merchant,
      amount: Number(d.amount),
      category: d.category,
      rawDescription: d.description,
      upiId: d.upi_id,
      bankRef: d.bank_ref,
    }));
  } catch (err) {
    console.warn('Supabase load statements error:', err);
    return [];
  }
}

export async function supabaseDeleteUserData(userId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !userId) return;
  try {
    await client.from('fin_statements').delete().eq('user_id', userId);
  } catch {}
}
