import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(__dirname, '..', 'fin-data.json');
const MAX_STORED = 500;

export type StoredTransaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  timestamp: number;
  severity: 'good' | 'warn' | 'danger';
  reasons: string; // JSON-encoded string[], kept as string to mirror a real DB column
  source: 'simulator' | 'account_aggregator' | 'sms';
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
