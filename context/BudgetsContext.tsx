import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { budgets as initialBudgets, Budget } from '../data/mockData';

type BudgetsState = {
  budgets: Budget[];
  setLimit: (category: string, budgeted: number) => void;
};

const BudgetsContext = createContext<BudgetsState | undefined>(undefined);

export function BudgetsProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);

  const setLimit = useCallback((category: string, budgeted: number) => {
    if (budgeted <= 0) return;
    setBudgets((prev) => prev.map((b) => (b.category === category ? { ...b, budgeted } : b)));
  }, []);

  return <BudgetsContext.Provider value={{ budgets, setLimit }}>{children}</BudgetsContext.Provider>;
}

export function useBudgets() {
  const ctx = useContext(BudgetsContext);
  if (!ctx) throw new Error('useBudgets must be used within BudgetsProvider');
  return ctx;
}
