export type TxPoint = {
  amount: number;
  timestamp?: number;
  category?: string;
};

export type CashFlowForecast = {
  currentBalance: number;
  projectedBalance: number;
  expectedIncome: number;
  expectedExpenses: number;
  daysToLow: number | null;
  history: number[];
  forecast: number[];
  /** true when computed from user's real transactions, not demo data */
  isReal: boolean;
  dataPoints: number;
};

const INCOME_HINT = /income|salary|credit|refund|interest|dividend|freelance|reimbursement/i;

function isIncome(tx: TxPoint) {
  if (tx.amount > 0) return true;
  return INCOME_HINT.test(tx.category ?? '');
}

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Predicts cash flow from real transaction history — no Setu/PAN needed.
 * Works with SMS-ingested txns, CSV imports, or backend live feed.
 */
export function predictCashFlow(
  transactions: TxPoint[],
  opts?: { lowBalanceThreshold?: number; forecastDays?: number }
): CashFlowForecast {
  const threshold = opts?.lowBalanceThreshold ?? 2000;
  const forecastDays = opts?.forecastDays ?? 30;

  const withTs = transactions.filter((t) => t.timestamp && Number.isFinite(t.timestamp));
  if (withTs.length < 3) {
    return {
      currentBalance: 0,
      projectedBalance: 0,
      expectedIncome: 0,
      expectedExpenses: 0,
      daysToLow: null,
      history: [],
      forecast: [],
      isReal: false,
      dataPoints: withTs.length,
    };
  }

  const sorted = [...withTs].sort((a, b) => (a.timestamp! - b.timestamp!));
  const now = Date.now();
  const windowMs = 30 * 24 * 60 * 60 * 1000;
  const recent = sorted.filter((t) => now - t.timestamp! <= windowMs);

  let income = 0;
  let expense = 0;
  for (const tx of sorted) {
    const abs = Math.abs(tx.amount);
    if (isIncome(tx)) income += abs;
    else expense += abs;
  }

  const latestTxTs = Math.max(...sorted.map(t => t.timestamp!));
  const earliestTxTs = Math.min(...sorted.map(t => t.timestamp!));
  // Use at least 30 days to avoid crazy daily burn rates from small imports
  const spanDays = Math.max(30, (latestTxTs - earliestTxTs) / (24 * 60 * 60 * 1000));

  const dailyIncome = income / spanDays;
  const dailyExpense = expense / spanDays;
  const dailyNet = dailyIncome - dailyExpense;

  // Running balance from chronological net flows
  let balance = 0;
  const dailyNetMap = new Map<string, number>();
  for (const tx of sorted) {
    const key = dayKey(tx.timestamp!);
    const delta = isIncome(tx) ? Math.abs(tx.amount) : -Math.abs(tx.amount);
    dailyNetMap.set(key, (dailyNetMap.get(key) ?? 0) + delta);
  }

  const dayKeys = [...dailyNetMap.keys()].sort();
  const history: number[] = [];
  for (const key of dayKeys.slice(-5)) {
    balance += dailyNetMap.get(key)!;
    history.push(Math.round(balance));
  }
  if (history.length === 0) history.push(0);

  const currentBalance = history[history.length - 1] ?? 0;
  const forecast: number[] = [];
  let projected = currentBalance;
  for (let d = 1; d <= 5; d++) {
    projected += dailyNet * (forecastDays / 5);
    forecast.push(Math.round(projected));
  }

  let daysToLow: number | null = null;
  if (dailyNet < 0 && currentBalance > threshold) {
    daysToLow = Math.ceil((currentBalance - threshold) / Math.abs(dailyNet));
  } else if (currentBalance <= threshold) {
    daysToLow = 0;
  }

  return {
    currentBalance: Math.round(currentBalance),
    projectedBalance: Math.round(currentBalance + dailyNet * forecastDays),
    expectedIncome: Math.round(dailyIncome * forecastDays),
    expectedExpenses: Math.round(dailyExpense * forecastDays),
    daysToLow,
    history,
    forecast,
    isReal: true,
    dataPoints: withTs.length,
  };
}

export type MonthlySnapshot = {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
  incomeChangePct: number;
  expenseChangePct: number;
  savingsChangePct: number;
  isReal: boolean;
};

export function computeMonthlySnapshot(transactions: TxPoint[]): MonthlySnapshot | null {
  const withTs = transactions.filter((t) => t.timestamp);
  if (withTs.length < 2) return null;

  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const tx of withTs) {
    const d = new Date(tx.timestamp!);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const row = byMonth.get(key) ?? { income: 0, expense: 0 };
    const abs = Math.abs(tx.amount);
    if (isIncome(tx)) row.income += abs;
    else row.expense += abs;
    byMonth.set(key, row);
  }

  const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const current = months[months.length - 1][1];
  const previous = months.length > 1 ? months[months.length - 2][1] : current;

  const savings = current.income - current.expense;
  const savingsRate = current.income > 0 ? Math.round((savings / current.income) * 100) : 0;
  const prevSavings = previous.income - previous.expense;

  const pct = (cur: number, prev: number) =>
    prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : 0;

  return {
    income: current.income,
    expense: current.expense,
    savings,
    savingsRate,
    incomeChangePct: pct(current.income, previous.income),
    expenseChangePct: pct(current.expense, previous.expense),
    savingsChangePct: pct(savings, prevSavings),
    isReal: true,
  };
}

export type MonthlyTrendPoint = { month: string; income: number; expense: number; savings: number };

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function computeMonthlyTrend(transactions: TxPoint[]): MonthlyTrendPoint[] {
  const withTs = transactions.filter((t) => t.timestamp);
  const byMonth = new Map<string, { income: number; expense: number; order: number }>();
  for (const tx of withTs) {
    const d = new Date(tx.timestamp!);
    const order = d.getFullYear() * 12 + d.getMonth();
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const row = byMonth.get(key) ?? { income: 0, expense: 0, order };
    const abs = Math.abs(tx.amount);
    if (isIncome(tx)) row.income += abs;
    else row.expense += abs;
    byMonth.set(key, row);
  }
  return [...byMonth.values()]
    .sort((a, b) => a.order - b.order)
    .slice(-6)
    .map((row) => {
      const monthIdx = row.order % 12;
      return {
        month: MONTH_LABELS[monthIdx],
        income: row.income,
        expense: row.expense,
        savings: row.income - row.expense,
      };
    });
}

export type CategorySpend = { category: string; amount: number; color: string };

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF6B6B',
  'Food & Dining': '#FF6B6B',
  Groceries: '#FFB454',
  Transport: '#5B8CFF',
  Subscriptions: '#8B6BFF',
  Subscription: '#8B6BFF',
  Shopping: '#33D6A6',
  Income: '#10b981',
  Transfer: '#5B6B82',
  Uncategorized: '#5B6B82',
  Other: '#5B6B82',
};

export function computeCategorySpend(transactions: TxPoint[]): CategorySpend[] {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    if (isIncome(tx)) continue;
    const cat = tx.category?.trim() || 'Uncategorized';
    map.set(cat, (map.get(cat) ?? 0) + Math.abs(tx.amount));
  }
  return [...map.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      color: CATEGORY_COLORS[category] ?? '#5B6B82',
    }))
    .sort((a, b) => b.amount - a.amount);
}
