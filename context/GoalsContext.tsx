import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { goals as initialGoals, Goal } from '../data/mockData';

export type Contribution = {
  id: string;
  amount: number;
  date: string;
};

export type GoalWithContributions = Goal & { contributions: Contribution[] };

type GoalsState = {
  goals: GoalWithContributions[];
  getGoal: (id: string) => GoalWithContributions | undefined;
  addFunds: (goalId: string, amount: number) => void;
};

const GoalsContext = createContext<GoalsState | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<GoalWithContributions[]>(
    initialGoals.map((g) => ({
      ...g,
      contributions: [{ id: `${g.id}-seed`, amount: g.current, date: 'Starting balance' }],
    }))
  );

  const addFunds = useCallback((goalId: string, amount: number) => {
    if (amount <= 0) return;
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              current: g.current + amount,
              contributions: [{ id: `${goalId}-${Date.now()}`, amount, date: 'Just now' }, ...g.contributions],
            }
          : g
      )
    );
  }, []);

  const getGoal = useCallback((id: string) => goals.find((g) => g.id === id), [goals]);

  return <GoalsContext.Provider value={{ goals, getGoal, addFunds }}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within GoalsProvider');
  return ctx;
}
