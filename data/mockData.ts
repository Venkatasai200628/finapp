export type Severity = 'good' | 'warn' | 'danger';

export type Alert = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  time: string;
  source: 'transaction' | 'forecast' | 'risk' | 'trading';
};

export type Transaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  time: string;
  flagged: boolean;
};

export type HealthFactor = {
  label: string;
  score: number;
};

export const healthScore = 74;

export const healthFactors: HealthFactor[] = [
  { label: 'Spending Stability', score: 80 },
  { label: 'Cash Flow Stability', score: 65 },
  { label: 'Savings Behavior', score: 85 },
  { label: 'Financial Risk', score: 60 },
  { label: 'Investment Stability', score: 70 },
];

// ---- Monthly summary: Income / Expenditure / Savings ----
export const monthlySummary = {
  income: 62000,
  expense: 41500,
  savings: 20500,
  savingsRate: 33,
  incomeChangePct: 4.2,
  expenseChangePct: 11.8,
  savingsChangePct: -6.4,
};

export type CategorySpend = {
  category: string;
  amount: number;
  color: string;
};

export const categorySpend: CategorySpend[] = [
  { category: 'Food & Dining', amount: 9200, color: '#FF6B6B' },
  { category: 'Groceries', amount: 6400, color: '#FFB454' },
  { category: 'Transport', amount: 4100, color: '#5B8CFF' },
  { category: 'Subscriptions', amount: 2300, color: '#8B6BFF' },
  { category: 'Shopping', amount: 8900, color: '#33D6A6' },
  { category: 'Other', amount: 10600, color: '#5B6B82' },
];

export const alerts: Alert[] = [
  {
    id: 'a1',
    severity: 'danger',
    title: 'Unusual transaction detected',
    detail: '₹15,000 at an unfamiliar merchant, 2:30 AM — 6x your usual spend in this category.',
    time: '2 min ago',
    source: 'transaction',
  },
  {
    id: 'a2',
    severity: 'warn',
    title: 'Balance may run low in 18 days',
    detail: 'Expenses are outpacing income at the current rate.',
    time: '3 hr ago',
    source: 'forecast',
  },
  {
    id: 'a3',
    severity: 'warn',
    title: 'Savings rate declining',
    detail: 'Down from 30% to 10% over the last 4 months.',
    time: '1 day ago',
    source: 'risk',
  },
];

export const transactions: Transaction[] = [
  { id: 't1', merchant: 'Unknown Merchant', category: 'Uncategorized', amount: -15000, time: 'Today, 2:30 AM', flagged: true },
  { id: 't2', merchant: 'Swiggy', category: 'Food', amount: -420, time: 'Yesterday, 8:12 PM', flagged: false },
  { id: 't3', merchant: 'Salary Credit', category: 'Income', amount: 45000, time: '3 days ago', flagged: false },
  { id: 't4', merchant: 'Netflix', category: 'Subscription', amount: -649, time: '4 days ago', flagged: false },
  { id: 't5', merchant: 'Big Bazaar', category: 'Groceries', amount: -1850, time: '5 days ago', flagged: false },
  { id: 't6', merchant: 'Uber', category: 'Transport', amount: -280, time: '6 days ago', flagged: false },
];

// ---- Full transaction history (used by the "See all" screen) ----
export const allTransactions: Transaction[] = [
  ...transactions,
  { id: 't7', merchant: 'Amazon', category: 'Shopping', amount: -2340, time: '7 days ago', flagged: false },
  { id: 't8', merchant: 'Zomato', category: 'Food', amount: -560, time: '8 days ago', flagged: false },
  { id: 't9', merchant: 'Spotify', category: 'Subscription', amount: -119, time: '9 days ago', flagged: false },
  { id: 't10', merchant: 'DMart', category: 'Groceries', amount: -2100, time: '10 days ago', flagged: false },
  { id: 't11', merchant: 'Ola', category: 'Transport', amount: -310, time: '11 days ago', flagged: false },
  { id: 't12', merchant: 'Freelance Payment', category: 'Income', amount: 12000, time: '12 days ago', flagged: false },
  { id: 't13', merchant: 'Starbucks', category: 'Food', amount: -450, time: '13 days ago', flagged: false },
  { id: 't14', merchant: 'Myntra', category: 'Shopping', amount: -3200, time: '14 days ago', flagged: false },
  { id: 't15', merchant: 'Flipkart', category: 'Shopping', amount: -1899, time: '15 days ago', flagged: false },
  { id: 't16', merchant: 'BigBasket', category: 'Groceries', amount: -1640, time: '16 days ago', flagged: false },
  { id: 't17', merchant: 'IRCTC', category: 'Transport', amount: -890, time: '17 days ago', flagged: false },
  { id: 't18', merchant: 'Hotstar', category: 'Subscription', amount: -299, time: '18 days ago', flagged: false },
  { id: 't19', merchant: 'Unknown Merchant', category: 'Uncategorized', amount: -8600, time: '19 days ago', flagged: true },
  { id: 't20', merchant: 'Salary Credit', category: 'Income', amount: 45000, time: '1 month ago', flagged: false },
];

// ---- Budget vs Actual ----
export type Budget = {
  category: string;
  budgeted: number;
  spent: number;
  color: string;
};

export const budgets: Budget[] = [
  { category: 'Food & Dining', budgeted: 8000, spent: 9200, color: '#FF6B6B' },
  { category: 'Groceries', budgeted: 7000, spent: 6400, color: '#FFB454' },
  { category: 'Transport', budgeted: 4500, spent: 4100, color: '#5B8CFF' },
  { category: 'Subscriptions', budgeted: 2000, spent: 2300, color: '#8B6BFF' },
  { category: 'Shopping', budgeted: 6000, spent: 8900, color: '#33D6A6' },
];

// ---- Savings goals ----
export type Goal = {
  id: string;
  name: string;
  icon: string;
  current: number;
  target: number;
  color: string;
  targetDate: string;
};

export const goals: Goal[] = [
  { id: 'g1', name: 'Emergency Fund', icon: 'shield-checkmark', current: 68000, target: 120000, color: '#33D6A6', targetDate: 'Dec 2026' },
  { id: 'g2', name: 'New Laptop', icon: 'laptop', current: 32000, target: 65000, color: '#5B8CFF', targetDate: 'Mar 2027' },
  { id: 'g3', name: 'Goa Trip', icon: 'airplane', current: 9000, target: 25000, color: '#FFB454', targetDate: 'Jan 2027' },
];

export const cashFlowForecast = {
  currentBalance: 20000,
  expectedIncome: 15000,
  expectedExpenses: 28000,
  projectedBalance: 7000,
  daysToLow: 18,
  history: [22000, 24500, 21000, 23000, 20000],
  forecast: [20000, 17500, 14000, 10500, 7000],
};

export const stressTrend = {
  savingsRateHistory: [30, 25, 18, 10],
  expenseTrendMonths: 4,
  creditUsage: 'increasing' as const,
  riskLevel: 'warn' as Severity,
};

// ---- Baseline behavior profile used by the real-time detection engine ----
// This models "what normal looks like" for this user, so incoming simulated
// transactions can be scored against it (amount, time-of-day, merchant).
export const behaviorBaseline = {
  categories: [
    { category: 'Food', merchants: ['Swiggy', 'Zomato', 'Domino\'s', 'Starbucks'], avgAmount: 380, stdDev: 180 },
    { category: 'Groceries', merchants: ['Big Bazaar', 'DMart', 'BigBasket'], avgAmount: 1400, stdDev: 600 },
    { category: 'Transport', merchants: ['Uber', 'Ola', 'IRCTC'], avgAmount: 260, stdDev: 150 },
    { category: 'Shopping', merchants: ['Amazon', 'Flipkart', 'Myntra'], avgAmount: 1600, stdDev: 900 },
    { category: 'Subscription', merchants: ['Netflix', 'Spotify', 'Hotstar'], avgAmount: 550, stdDev: 200 },
  ],
  normalHourStart: 7,
  normalHourEnd: 23,
  maxNormalAmount: 3500,
};
