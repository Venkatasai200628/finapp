import { listTransactions, StoredTransaction } from './db';

export type CategoryStats = {
  category: string;
  merchants: string[];
  avgAmount: number;
  stdDev: number;
  sampleSize: number;
};

export type Baseline = {
  categories: CategoryStats[];
  normalHourStart: number;
  normalHourEnd: number;
  maxNormalAmount: number;
  /** How many stored transactions actually informed this profile. */
  learnedFrom: number;
  /** False while there isn't enough history yet and we're still on seed values. */
  isLearned: boolean;
};

/**
 * Cold-start values. A brand new user has no history, so there is nothing to
 * learn from — these stand in until enough real transactions accumulate, then
 * computeBaseline() replaces them category by category.
 */
export const SEED_BASELINE: Baseline = {
  categories: [
    { category: 'Food', merchants: ['Swiggy', 'Zomato', "Domino's", 'Starbucks'], avgAmount: 380, stdDev: 180, sampleSize: 0 },
    { category: 'Groceries', merchants: ['Big Bazaar', 'DMart', 'BigBasket'], avgAmount: 1400, stdDev: 600, sampleSize: 0 },
    { category: 'Transport', merchants: ['Uber', 'Ola', 'IRCTC'], avgAmount: 260, stdDev: 150, sampleSize: 0 },
    { category: 'Shopping', merchants: ['Amazon', 'Flipkart', 'Myntra'], avgAmount: 1600, stdDev: 900, sampleSize: 0 },
    { category: 'Subscription', merchants: ['Netflix', 'Spotify', 'Hotstar'], avgAmount: 550, stdDev: 200, sampleSize: 0 },
  ],
  normalHourStart: 7,
  normalHourEnd: 23,
  maxNormalAmount: 3500,
  learnedFrom: 0,
  isLearned: false,
};

const LEARNING_WINDOW = 300;
const MIN_SAMPLES_OVERALL = 12;
const MIN_SAMPLES_PER_CATEGORY = 4;
/**
 * How many distinct hours-of-day must appear before the learned active-hours
 * window is trusted. Without this, history gathered in a single sitting (say
 * all of it near 11pm) collapses the window to that one hour, and then every
 * transaction at any other time scores as "outside usual hours" — the
 * detector would flag the user's entire normal day.
 */
const MIN_DISTINCT_HOURS = 5;

/**
 * Decides whether a stored transaction is allowed to teach the baseline what
 * "normal" looks like.
 *
 * The important case is 'fraud': if confirmed-fraudulent transactions fed the
 * baseline, then every fraud the user reports would widen the normal range and
 * make the NEXT fraud less likely to be caught — the detector would train
 * itself blind. Unreviewed anomalies are excluded for the same reason, more
 * weakly: nobody has vouched for them, so they don't get to move the goalposts.
 */
export function isLearnable(tx: StoredTransaction): boolean {
  if (tx.verdict === 'fraud') return false;
  if (tx.verdict === 'safe') return true;
  return tx.severity !== 'danger';
}

function mean(values: number[]) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDeviation(values: number[], avg: number) {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.round((p / 100) * (sorted.length - 1));
  return sorted[Math.min(sorted.length - 1, Math.max(0, idx))];
}

/**
 * Derives the user's behavior profile from their own stored transactions.
 * Falls back to SEED_BASELINE wholesale below MIN_SAMPLES_OVERALL, and
 * per-category for any category that hasn't been seen enough times yet.
 */
export function computeBaseline(): Baseline {
  const learnable = listTransactions(LEARNING_WINDOW).filter(isLearnable);
  // Spending baselines are about spending — income would badly skew every stat.
  const expenses = learnable.filter((t) => t.amount < 0);

  if (expenses.length < MIN_SAMPLES_OVERALL) {
    return { ...SEED_BASELINE, learnedFrom: expenses.length };
  }

  const byCategory = new Map<string, StoredTransaction[]>();
  for (const tx of expenses) {
    const list = byCategory.get(tx.category) ?? [];
    list.push(tx);
    byCategory.set(tx.category, list);
  }

  const seenCategories = new Set<string>();
  const categories: CategoryStats[] = [];

  for (const [category, rows] of byCategory) {
    seenCategories.add(category);
    const seed = SEED_BASELINE.categories.find((c) => c.category === category);

    if (rows.length < MIN_SAMPLES_PER_CATEGORY) {
      // Not enough of this category yet — keep the seed numbers, but do
      // credit any merchants already seen so they stop reading as unfamiliar.
      const merchants = Array.from(new Set([...(seed?.merchants ?? []), ...rows.map((r) => r.merchant)]));
      categories.push({
        category,
        merchants,
        avgAmount: seed?.avgAmount ?? Math.round(mean(rows.map((r) => Math.abs(r.amount)))),
        stdDev: seed?.stdDev ?? 0,
        sampleSize: rows.length,
      });
      continue;
    }

    const amounts = rows.map((r) => Math.abs(r.amount));
    const avg = mean(amounts);
    categories.push({
      category,
      merchants: Array.from(new Set(rows.map((r) => r.merchant))),
      avgAmount: Math.round(avg),
      // Floor the deviation so a run of near-identical amounts can't collapse
      // it to ~0 and make every later transaction look like a wild outlier.
      stdDev: Math.max(Math.round(stdDeviation(amounts, avg)), Math.round(avg * 0.15)),
      sampleSize: rows.length,
    });
  }

  // Categories with no history at all still need their seed entry present.
  for (const seed of SEED_BASELINE.categories) {
    if (!seenCategories.has(seed.category)) categories.push({ ...seed });
  }

  const hours = expenses.map((t) => new Date(t.timestamp).getHours());
  const amounts = expenses.map((t) => Math.abs(t.amount));
  const hoursAreRepresentative = new Set(hours).size >= MIN_DISTINCT_HOURS;

  return {
    categories,
    // NOTE: this treats hours as a plain 0-23 line, so a user who genuinely
    // transacts across midnight gets an over-wide range. Real circular
    // statistics would be the correct fix if that pattern shows up.
    normalHourStart: hoursAreRepresentative ? percentile(hours, 5) : SEED_BASELINE.normalHourStart,
    normalHourEnd: hoursAreRepresentative ? percentile(hours, 95) : SEED_BASELINE.normalHourEnd,
    maxNormalAmount: Math.max(percentile(amounts, 95), 500),
    learnedFrom: expenses.length,
    isLearned: true,
  };
}
