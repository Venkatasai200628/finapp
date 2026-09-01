import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(__dirname, '..', 'fin-data.json');
const MAX_STORED = 500;

/** What the user said about a flagged transaction, once they reviewed it. */
export type Verdict = 'safe' | 'fraud';

export type StoredTransaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  timestamp: number;
  severity: 'good' | 'warn' | 'danger';
  reasons: string; // JSON-encoded string[], kept as string to mirror a real DB column
  source: 'simulator' | 'account_aggregator' | 'sms';
  verdict?: Verdict | null;
};

function load(): StoredTransaction[] {
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function save(rows: StoredTransaction[]) {
  fs.writeFileSync(DB_FILE, JSON.stringify(rows, null, 2));
}

export function insertTransaction(tx: StoredTransaction) {
  const rows = load();
  rows.unshift(tx);
  save(rows.slice(0, MAX_STORED));
}

export function listTransactions(limit = 50): StoredTransaction[] {
  return load()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function listFlagged(limit = 50): StoredTransaction[] {
  return load()
    .filter((t) => t.severity === 'danger')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function getTransaction(id: string): StoredTransaction | undefined {
  return load().find((t) => t.id === id);
}

/** Records the user's review of a transaction. This is what feeds the
 * baseline's learning set — see baseline.ts / isLearnable(). */
export function setVerdict(id: string, verdict: Verdict): StoredTransaction | undefined {
  const rows = load();
  const row = rows.find((t) => t.id === id);
  if (!row) return undefined;
  row.verdict = verdict;
  save(rows);
  return row;
}
