import { behaviorBaseline } from '../data/mockData';

export type LiveTransaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  timestamp: number;
  severity: 'good' | 'warn' | 'danger';
  reasons: string[];
  source?: 'simulator' | 'account_aggregator' | 'sms';
};

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gaussian(mean: number, stdDev: number) {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/**
 * Simulates one incoming transaction event and scores it against the user's
 * baseline behavior profile — the same "compare with normal, flag deviation"
 * approach a real notification/SMS-parsing pipeline would use.
 */
export function generateTransactionEvent(): LiveTransaction {
  const isAnomalous = Math.random() < 0.28;
  const hour = new Date().getHours();

  if (isAnomalous) {
    const anomalyType = randomOf(['huge_amount', 'odd_hour', 'unknown_merchant']);
    let amount = -Math.round(gaussian(14000, 5000));
    let merchant = 'Unknown Merchant';
    let category = 'Uncategorized';
    const reasons: string[] = [];

    if (anomalyType === 'huge_amount') {
      amount = -Math.round(3500 + Math.random() * 20000);
      const cat = randomOf(behaviorBaseline.categories);
      merchant = randomOf(cat.merchants);
      category = cat.category;
      reasons.push(`${Math.abs(Math.round(amount / cat.avgAmount))}x your usual ${cat.category.toLowerCase()} spend`);
    } else if (anomalyType === 'odd_hour') {
      amount = -Math.round(800 + Math.random() * 4000);
      const cat = randomOf(behaviorBaseline.categories);
      merchant = randomOf(cat.merchants);
      category = cat.category;
      reasons.push('Occurred outside your usual active hours');
    } else {
      reasons.push('Unfamiliar merchant with no transaction history');
    }

    if (hour < behaviorBaseline.normalHourStart || hour > behaviorBaseline.normalHourEnd) {
      if (!reasons.some((r) => r.includes('hours'))) reasons.push('Outside typical transaction hours');
    }

    return {
      id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      merchant,
      category,
      amount,
      timestamp: Date.now(),
      severity: 'danger',
      reasons,
    };
  }

  // Normal transaction drawn from the baseline profile
  const cat = randomOf(behaviorBaseline.categories);
  const merchant = randomOf(cat.merchants);
  const amount = -Math.max(50, Math.round(gaussian(cat.avgAmount, cat.stdDev)));
  const isIncome = Math.random() < 0.06;

  return {
    id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    merchant: isIncome ? 'Salary / Credit' : merchant,
    category: isIncome ? 'Income' : cat.category,
    amount: isIncome ? Math.round(4000 + Math.random() * 3000) : amount,
    timestamp: Date.now(),
    severity: 'good',
    reasons: [],
  };
}
