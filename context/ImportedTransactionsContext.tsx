import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { ParsedStatementRow } from '../lib/bankStatementParser';
import { useAuth } from './AuthContext';
import { supabaseLoadStatements, supabaseSaveStatements, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY = 'fin.imported.transactions';

type ImportedState = {
  imported: ParsedStatementRow[];
  addImported: (rows: ParsedStatementRow[]) => void;
  clearImported: () => void;
  loading: boolean;
};

const ImportedContext = createContext<ImportedState | undefined>(undefined);

export function ImportedTransactionsProvider({ children }: { children: ReactNode }) {
  const [imported, setImported] = useState<ParsedStatementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  // Load statements on initial mount
  useEffect(() => {
    async function loadInitial() {
      let rows: ParsedStatementRow[] = [];

      // 1. Load locally cached statements
      if (Platform.OS === 'web') {
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) rows = JSON.parse(cached);
        } catch {}
      }

      // 2. If Supabase is configured and user logged in, fetch cloud statements
      if (userId && isSupabaseConfigured()) {
        try {
          const cloudRows = await supabaseLoadStatements(userId);
          if (cloudRows && cloudRows.length > 0) {
            const map = new Map<string, ParsedStatementRow>();
            [...cloudRows, ...rows].forEach((r) => map.set(r.id, r));
            rows = Array.from(map.values());
          }
        } catch {}
      }

      if (rows.length > 0) {
        setImported(rows);
      }
      setLoading(false);
    }

    loadInitial();
  }, [userId]);

  const addImported = useCallback((rows: ParsedStatementRow[]) => {
    setImported((prev) => {
      const ids = new Set(prev.map((r) => r.id));
      const fresh = rows.filter((r) => !ids.has(r.id));
      const updated = [...fresh, ...prev];

      // Save to local storage
      if (Platform.OS === 'web') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }

      // Sync to Supabase cloud
      if (userId && isSupabaseConfigured()) {
        supabaseSaveStatements(userId, fresh).catch(() => {});
      }

      return updated;
    });
  }, [userId]);

  const clearImported = useCallback(() => {
    setImported([]);
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, []);

  return (
    <ImportedContext.Provider value={{ imported, addImported, clearImported, loading }}>
      {children}
    </ImportedContext.Provider>
  );
}

export function useImportedTransactions() {
  const ctx = useContext(ImportedContext);
  if (!ctx) throw new Error('useImportedTransactions must be used within ImportedTransactionsProvider');
  return ctx;
}
