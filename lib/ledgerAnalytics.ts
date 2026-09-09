export type LedgerTransaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  timestamp?: number;
  source?: string;
};

export type PartySummary = {
  party: string;
  /** Money sent to this party (absolute debits). */
  paidOut: number;
  /** Money received from this party. */
  received: number;
  net: number;
  transactionCount: number;
  /** paidOut + received — total volume with this party. */
  totalVolume: number;
  isHighVolume: boolean;
};

export type LedgerOverview = {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  parties: PartySummary[];
  topPayees: PartySummary[];
  topPayers: PartySummary[];
  expenseByCategory: Array<{ category: string; amount: number }>;
  incomeByCategory: Array<{ category: string; amount: number }>;
};

const INCOME_HINT = /income|salary|credit|refund|interest|dividend|freelance|reimbursement/i;

function isIncome(tx: LedgerTransaction) {
  if (tx.amount > 0) return true;
  return INCOME_HINT.test(tx.category);
}

export function summarizeParties(transactions: LedgerTransaction[], highVolumeTopN = 5): PartySummary[] {
  const map = new Map<string, PartySummary>();

  for (const tx of transactions) {
    const party = (tx.merchant ? String(tx.merchant).trim() : '') || 'Unknown';
    const row = map.get(party) ?? {
      party,
      paidOut: 0,
      received: 0,
      net: 0,
      transactionCount: 0,
      totalVolume: 0,
      isHighVolume: false,
    };

    const numAmt = Number.isFinite(Number(tx.amount)) ? Number(tx.amount) : 0;
    row.transactionCount += 1;
    if (isIncome(tx)) {
      row.received += Math.abs(numAmt);
      row.net += Math.abs(numAmt);
    } else {
      row.paidOut += Math.abs(numAmt);
      row.net -= Math.abs(numAmt);
    }
    row.totalVolume = row.paidOut + row.received;
    map.set(party, row);
  }

  const parties = [...map.values()].sort((a, b) => b.totalVolume - a.totalVolume);
  parties.forEach((p, i) => {
    p.isHighVolume = i < highVolumeTopN;
  });
  return parties;
}

export function buildLedgerOverview(transactions: LedgerTransaction[]): LedgerOverview {
  let totalIncome = 0;
  let totalExpense = 0;
  const expenseCat = new Map<string, number>();
  const incomeCat = new Map<string, number>();

  for (const tx of transactions) {
    const abs = Math.abs(Number.isFinite(Number(tx.amount)) ? Number(tx.amount) : 0);
    const cat = (tx.category ? String(tx.category).trim() : '') || 'Uncategorized';
    if (isIncome(tx)) {
      totalIncome += abs;
      incomeCat.set(cat, (incomeCat.get(cat) ?? 0) + abs);
    } else {
      totalExpense += abs;
      expenseCat.set(cat, (expenseCat.get(cat) ?? 0) + abs);
    }
  }

  const parties = summarizeParties(transactions);
  const topPayees = [...parties].filter((p) => p.paidOut > 0).sort((a, b) => b.paidOut - a.paidOut).slice(0, 8);
  const topPayers = [...parties].filter((p) => p.received > 0).sort((a, b) => b.received - a.received).slice(0, 8);

  const toSorted = (m: Map<string, number>) =>
    [...m.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    parties,
    topPayees,
    topPayers,
    expenseByCategory: toSorted(expenseCat),
    incomeByCategory: toSorted(incomeCat),
  };
}
