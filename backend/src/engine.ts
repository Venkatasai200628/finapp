import { behaviorBaseline } from './baseline';

export type Severity = 'good' | 'warn' | 'danger';

export type EngineTransaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  timestamp: number;
  severity: Severity;
  reasons: string[];
  source: 'simulator' | 'account_aggregator' | 'sms';
};

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gaussian(mean: number, stdDev: number) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

/**
 * Generates one simulated transaction event, pre-scored against the baseline
 * profile. This is the stand-in for a real event source (Account Aggregator
 * poll or SMS listener) — see scoreTransaction() below for the part that
 * stays the same once real data replaces this generator.
 */
export function generateTransactionEvent(): EngineTransaction {
  const isAnomalous = Math.random() < 0.28;
  const hour = new Date().getHours();

  if (isAnomalous) {
    const anomalyType = randomOf(['huge_amount', 'odd_hour', 'unknown_merchant']);
    let amount = -Math.round(3500 + Math.random() * 20000);
    let merchant = 'Unknown Merchant';
    let category = 'Uncategorized';
    const reasons: string[] = [];

    if (anomalyType === 'huge_amount') {
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
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      merchant,
      category,
      amount,
      timestamp: Date.now(),
      severity: 'danger',
      reasons,
      source: 'simulator',
    };
  }

  const cat = randomOf(behaviorBaseline.categories);
  const merchant = randomOf(cat.merchants);
  const amount = -Math.max(50, Math.round(gaussian(cat.avgAmount, cat.stdDev)));
  const isIncome = Math.random() < 0.06;

  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    merchant: isIncome ? 'Salary / Credit' : merchant,
    category: isIncome ? 'Income' : cat.category,
    amount: isIncome ? Math.round(4000 + Math.random() * 3000) : amount,
    timestamp: Date.now(),
    severity: 'good',
    reasons: [],
    source: 'simulator',
  };
}

/**
 * Scores an already-real transaction (from Account Aggregator or SMS
 * parsing) against the baseline profile. This is the function real
 * ingestion paths should call instead of generateTransactionEvent().
 */
export function scoreTransaction(input: {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  timestamp: number;
  source: EngineTransaction['source'];
}): EngineTransaction {
  const hour = new Date(input.timestamp).getHours();
  const cat = behaviorBaseline.categories.find((c) => c.category === input.category);
  const reasons: string[] = [];
  let risk = 0;

  if (Math.abs(input.amount) > behaviorBaseline.maxNormalAmount) {
    risk += 2;
    reasons.push('Amount is well above your typical transaction size');
  }
  if (cat) {
    const z = (Math.abs(input.amount) - cat.avgAmount) / cat.stdDev;
    if (z > 3) {
      risk += 2;
      reasons.push(`${Math.round(z)}x standard deviations above your usual ${cat.category.toLowerCase()} spend`);
    }
    if (!cat.merchants.includes(input.merchant)) {
      risk += 1;
      reasons.push('Merchant not seen in your history for this category');
    }
  } else {
    risk += 1;
    reasons.push('Unrecognized category / merchant');
  }
  if (hour < behaviorBaseline.normalHourStart || hour > behaviorBaseline.normalHourEnd) {
    risk += 1;
    reasons.push('Outside typical transaction hours');
  }

  const severity: Severity = risk >= 3 ? 'danger' : risk >= 1 ? 'warn' : 'good';

  return { ...input, severity, reasons };
}
