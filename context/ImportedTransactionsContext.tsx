import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import type { ParsedStatementRow } from '../lib/bankStatementParser';

type ImportedState = {
  imported: ParsedStatementRow[];
  addImported: (rows: ParsedStatementRow[]) => void;
  clearImported: () => void;
};

const ImportedContext = createContext<ImportedState | undefined>(undefined);

export function ImportedTransactionsProvider({ children }: { children: ReactNode }) {
  const [imported, setImported] = useState<ParsedStatementRow[]>([]);

  const addImported = useCallback((rows: ParsedStatementRow[]) => {
    setImported((prev) => {
      const ids = new Set(prev.map((r) => r.id));
      const fresh = rows.filter((r) => !ids.has(r.id));
      return [...fresh, ...prev];
    });
  }, []);

  const clearImported = useCallback(() => setImported([]), []);

  return (
    <ImportedContext.Provider value={{ imported, addImported, clearImported }}>
      {children}
    </ImportedContext.Provider>
  );
}

export function useImportedTransactions() {
  const ctx = useContext(ImportedContext);
  if (!ctx) throw new Error('useImportedTransactions must be used within ImportedTransactionsProvider');
  return ctx;
}
