import { Baseline, SEED_BASELINE } from './baseline';

export type Severity = 'good' | 'warn' | 'danger';

export type RawTransaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  timestamp: number;
  source: 'simulator' | 'account_aggregator' | 'sms';
};

export type EngineTransaction = RawTransaction & {
  severity: Severity;
  reasons: string[];
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

function newId() {
  return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Stand-in for a real event source (Account Aggregator poll or SMS listener).
 *
 * Deliberately generates from SEED_BASELINE, never the learned one: this
 * represents what happens out in the world, which does not change just
 * because our model's beliefs changed. It also emits NO severity — deciding
 * what's suspicious is scoreTransaction()'s job alone, so the learned
 * baseline is genuinely what drives every flag.
 */
export function generateRawTransaction(): RawTransaction {
  const base = { id: newId(), timestamp: Date.now(), source: 'simulator' as const };

  if (Math.random() < 0.06) {
    return { ...base, merchant: 'Salary / Credit', category: 'Income', amount: Math.round(4000 + Math.random() * 3000) };
  }

  if (Math.random() < 0.25) {
    const kind = randomOf(['huge_amount', 'unknown_merchant', 'odd_hour']);
    if (kind === 'unknown_merchant') {
      return { ...base, merchant: 'Unknown Merchant', category: 'Uncategorized', amount: -Math.round(gaussian(9000, 4000)) };
    }
    const cat = randomOf(SEED_BASELINE.categories);
    const amount =
      kind === 'huge_amount'
        ? -Math.round(4000 + Math.random() * 20000)
        : -Math.round(800 + Math.random() * 4000);
    // An "odd hour" event backdates itself into the small hours so the
    // time-of-day rule has something real to catch.
    const timestamp = kind === 'odd_hour' ? new Date().setHours(3, Math.floor(Math.random() * 60), 0, 0) : base.timestamp;
    return { ...base, timestamp, merchant: randomOf(cat.merchants), category: cat.category, amount };
  }

  const cat = randomOf(SEED_BASELINE.categories);
  return {
    ...base,
    merchant: randomOf(cat.merchants),
    category: cat.category,
    amount: -Math.max(50, Math.round(gaussian(cat.avgAmount, cat.stdDev))),
  };
}

/**
 * Scores a transaction against the user's learned behavior profile.
 *
 * This is deviation detection, not fraud detection: it answers "is this
 * unlike what this person normally does", which is a reason to look, not
 * evidence of a threat.
 */
export function scoreTransaction(input: RawTransaction, baseline: Baseline): EngineTransaction {
  // Income isn't spending — scoring it against spending norms only ever
  // produces noise (a salary credit is not a suspicious grocery run).
  if (input.amount >= 0) {
    return { ...input, severity: 'good', reasons: [] };
  }

  const hour = new Date(input.timestamp).getHours();
  const magnitude = Math.abs(input.amount);
  const cat = baseline.categories.find((c) => c.category === input.category);
  const reasons: string[] = [];
  let risk = 0;

  if (magnitude > baseline.maxNormalAmount) {
    risk += 2;
    reasons.push(`₹${magnitude.toLocaleString('en-IN')} is above your usual ceiling of ₹${Math.round(baseline.maxNormalAmount).toLocaleString('en-IN')}`);
  }

  if (cat) {
    const z = cat.stdDev > 0 ? (magnitude - cat.avgAmount) / cat.stdDev : 0;
    if (z > 3) {
      risk += 2;
      const multiple = cat.avgAmount > 0 ? (magnitude / cat.avgAmount).toFixed(1) : '?';
      reasons.push(`${multiple}x your average ${cat.category.toLowerCase()} spend of ₹${cat.avgAmount.toLocaleString('en-IN')}`);
    }
    if (!cat.merchants.includes(input.merchant)) {
      risk += 1;
      reasons.push(`First time you've paid ${input.merchant} in ${cat.category.toLowerCase()}`);
    }
  } else {
    risk += 1;
    reasons.push('Merchant and category are both unfamiliar');
  }

  if (hour < baseline.normalHourStart || hour > baseline.normalHourEnd) {
    risk += 1;
    reasons.push(`${hour}:00 is outside your usual ${baseline.normalHourStart}:00–${baseline.normalHourEnd}:00 activity`);
  }

  const severity: Severity = risk >= 3 ? 'danger' : risk >= 1 ? 'warn' : 'good';
  return { ...input, severity, reasons };
}
