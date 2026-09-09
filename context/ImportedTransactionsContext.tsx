import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { ParsedStatementRow } from '../lib/bankStatementParser';
import { useAuth } from './AuthContext';
import { supabaseLoadStatements, supabaseSaveStatements, isSupabaseConfigured } from '../lib/supabaseClient';
import { getPersistentItem, setPersistentItem, removePersistentItem } from '../lib/tokenStore';

const STORAGE_KEY = 'fin.imported.transactions';
const CATEGORY_RULES_KEY = 'fin.category.rules';
const CUSTOM_CATEGORIES_KEY = 'fin.custom.categories';

export const DEFAULT_CATEGORIES = [
  'Food',
  'Groceries',
  'Transport',
  'Shopping',
  'Bills',
  'Subscription',
  'Transfer',
  'Income',
  'Trading',
  'Unknown',
];

function isSummaryOrBalanceRow(desc: string): boolean {
  const upper = desc.toUpperCase().trim();
  return (
    /^(TOTAL|GRAND\s*TOTAL|SUBTOTAL|SUMMARY|CLOSING\s*BAL|OPENING\s*BAL|BALANCE\s*B\/F|BALANCE\s*C\/F|B\/F|C\/F|BROUGHT\s*FORWARD|CARRIED\s*FORWARD)/i.test(upper) ||
    /^(TOTAL\s*DEBIT|TOTAL\s*CREDIT|TOTAL\s*WITHDRAWAL|TOTAL\s*DEPOSIT)/i.test(upper) ||
    /^CLOSING\s*BALANCE/i.test(upper) ||
    /^OPENING\s*BALANCE/i.test(upper)
  );
}

export function sanitizeRow(r: any): ParsedStatementRow {
  const amt = typeof r.amount === 'number' ? r.amount : parseFloat(String(r.amount || 0));
  const validAmt = Number.isFinite(amt) ? amt : 0;

  let ts = typeof r.timestamp === 'number' ? r.timestamp : parseInt(String(r.timestamp || 0), 10);
  if (!Number.isFinite(ts) || ts <= 0) {
    if (r.dateLabel) {
      const parsedDate = new Date(r.dateLabel).getTime();
      ts = Number.isFinite(parsedDate) && parsedDate > 0 ? parsedDate : Date.now();
    } else {
      ts = Date.now();
    }
  }

  const rawDescription = String(r.rawDescription || r.merchant || 'Bank Transaction').trim();
  const merchant = String(r.merchant || rawDescription || 'Bank Transaction').trim() || 'Bank Transaction';
  const category = String(r.category || 'Unknown').trim() || 'Unknown';
  
  let dateLabel = String(r.dateLabel || '').trim();
  if (!dateLabel || /^\d{4,6}$/.test(dateLabel)) {
    const d = new Date(ts);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()] || 'Jan';
    const year = d.getFullYear();
    dateLabel = `${day} ${month} ${year}`;
  }

  const id = String(r.id || `stmt_${ts}_${Math.random().toString(36).substring(2, 9)}`);

  const bal = typeof r.balance === 'number' ? r.balance : (r.balance ? parseFloat(String(r.balance)) : undefined);
  const balance = typeof bal === 'number' && Number.isFinite(bal) ? bal : undefined;

  return {
    ...r,
    id,
    merchant,
    category,
    amount: validAmt,
    balance,
    timestamp: ts,
    source: r.source || 'bank_statement',
    dateLabel,
    rawDescription,
  };
}

function applyRulesToRow(row: ParsedStatementRow, rules: Record<string, string>): ParsedStatementRow {
  const key = (row.merchant || '').toLowerCase().trim();
  if (key && rules[key]) {
    return { ...row, category: rules[key] };
  }
  return row;
}

type ImportedState = {
  imported: ParsedStatementRow[];
  addImported: (rows: ParsedStatementRow[]) => void;
  updateCategory: (id: string, newCategory: string) => void;
  clearImported: () => void;
  categoryRules: Record<string, string>;
  customCategories: string[];
  addCustomCategory: (cat: string) => void;
  loading: boolean;
};

const ImportedContext = createContext<ImportedState | undefined>(undefined);

export function ImportedTransactionsProvider({ children }: { children: ReactNode }) {
  const [imported, setImported] = useState<ParsedStatementRow[]>([]);
  const [categoryRules, setCategoryRules] = useState<Record<string, string>>({});
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  // Load statements, category rules, and custom categories on initial mount
  useEffect(() => {
    async function loadInitial() {
      let loadedRules: Record<string, string> = {};
      let loadedCustom: string[] = [];
      let rows: ParsedStatementRow[] = [];

      // 1. Load saved merchant-to-category rules
      try {
        const rulesRaw = await getPersistentItem(CATEGORY_RULES_KEY);
        if (rulesRaw) {
          loadedRules = JSON.parse(rulesRaw);
          setCategoryRules(loadedRules);
        }
      } catch {}

      // 2. Load custom user-created categories
      try {
        const customRaw = await getPersistentItem(CUSTOM_CATEGORIES_KEY);
        if (customRaw) {
          loadedCustom = JSON.parse(customRaw);
          if (Array.isArray(loadedCustom)) setCustomCategories(loadedCustom);
        }
      } catch {}

      // 3. Load locally cached statements
      try {
        const cached = await getPersistentItem(STORAGE_KEY);
        if (cached) {
          const raw = JSON.parse(cached);
          if (Array.isArray(raw)) rows = raw.map(sanitizeRow);
        }
      } catch {}

      // 4. If Supabase is configured and user logged in, fetch cloud statements
      if (userId && isSupabaseConfigured()) {
        try {
          const cloudRows = await supabaseLoadStatements(userId);
          if (cloudRows && cloudRows.length > 0) {
            const map = new Map<string, ParsedStatementRow>();
            [...cloudRows.map(sanitizeRow), ...rows].forEach((r) => map.set(r.id, r));
            rows = Array.from(map.values());
          }
        } catch {}
      }

      if (rows.length > 0) {
        const validRows = rows
          .filter((r) => !isSummaryOrBalanceRow(r.rawDescription) && !isSummaryOrBalanceRow(r.merchant))
          .map((r) => applyRulesToRow(r, loadedRules));
        setImported(validRows);
      }
      setLoading(false);
    }

    loadInitial();
  }, [userId]);

  const addImported = useCallback((rows: ParsedStatementRow[]) => {
    const cleanRows = rows
      .map(sanitizeRow)
      .filter((r) => !isSummaryOrBalanceRow(r.rawDescription) && !isSummaryOrBalanceRow(r.merchant))
      .map((r) => applyRulesToRow(r, categoryRules));

    setImported((prev) => {
      const ids = new Set(prev.map((r) => r.id));
      const fresh = cleanRows.filter((r) => !ids.has(r.id));
      const updated = [...fresh, ...prev];

      // Save to persistent storage
      void setPersistentItem(STORAGE_KEY, JSON.stringify(updated));

      // Sync to Supabase cloud
      if (userId && isSupabaseConfigured()) {
        supabaseSaveStatements(userId, fresh).catch(() => {});
      }

      return updated;
    });
  }, [categoryRules, userId]);

  const addCustomCategory = useCallback((cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    setCustomCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      const next = [...prev, trimmed];
      void setPersistentItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateCategory = useCallback((id: string, newCategory: string) => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    setImported((prev) => {
      const targetTx = prev.find((r) => r.id === id);
      const merchantKey = targetTx?.merchant?.toLowerCase().trim();

      // 1. Remember merchant-to-category rule so it applies EVERY TIME in the future!
      if (merchantKey) {
        setCategoryRules((oldRules) => {
          const updatedRules = { ...oldRules, [merchantKey]: trimmed };
          void setPersistentItem(CATEGORY_RULES_KEY, JSON.stringify(updatedRules));
          return updatedRules;
        });
      }

      // 2. Add to custom categories list if new
      if (
        !DEFAULT_CATEGORIES.some((c) => c.toLowerCase() === trimmed.toLowerCase()) &&
        !customCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())
      ) {
        addCustomCategory(trimmed);
      }

      // 3. Update all transactions matching this merchant (and this target id)
      const updated = prev.map((item) => {
        if (item.id === id) return { ...item, category: trimmed };
        if (merchantKey && item.merchant?.toLowerCase().trim() === merchantKey) {
          return { ...item, category: trimmed };
        }
        return item;
      });

      // Save to persistent storage
      void setPersistentItem(STORAGE_KEY, JSON.stringify(updated));

      // Sync to Supabase cloud
      if (userId && isSupabaseConfigured()) {
        const changed = updated.filter(
          (r) => r.id === id || (merchantKey && r.merchant?.toLowerCase().trim() === merchantKey)
        );
        supabaseSaveStatements(userId, changed).catch(() => {});
      }

      return updated;
    });
  }, [customCategories, addCustomCategory, userId]);

  const clearImported = useCallback(() => {
    setImported([]);
    void removePersistentItem(STORAGE_KEY);
  }, []);

  return (
    <ImportedContext.Provider
      value={{
        imported,
        addImported,
        updateCategory,
        clearImported,
        categoryRules,
        customCategories,
        addCustomCategory,
        loading,
      }}
    >
      {children}
    </ImportedContext.Provider>
  );
}

export function useImportedTransactions() {
  const ctx = useContext(ImportedContext);
  if (!ctx) throw new Error('useImportedTransactions must be used within ImportedTransactionsProvider');
  return ctx;
}
