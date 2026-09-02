import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

/**
 * Uses Node's built-in SQLite (Node 22.5+), so there is no native module to
 * compile — better-sqlite3 needs Visual Studio Build Tools on Windows, which
 * is a bad dependency to impose just to store rows.
 *
 * DB_PATH lets production point this at a persistent volume (see fly.toml —
 * mounted at /data) instead of the project folder, so the database survives
 * redeploys instead of living inside the container's throwaway filesystem.
 */
const DB_FILE = process.env.DB_PATH || path.join(__dirname, '..', 'fin.db');
export const db = new DatabaseSync(DB_FILE);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    merchant   TEXT NOT NULL,
    category   TEXT NOT NULL,
    -- Money is stored in paise as an INTEGER. Rupee floats (450.50) are not
    -- exactly representable in float64 and drift once summed; the conversion
    -- is confined to this file so the rest of the app still speaks rupees.
    amount_paise INTEGER NOT NULL,
    timestamp  INTEGER NOT NULL,
    severity   TEXT NOT NULL,
    reasons    TEXT NOT NULL DEFAULT '[]',
    source     TEXT NOT NULL,
    verdict    TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tx_user_time ON transactions(user_id, timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_tx_user_severity ON transactions(user_id, severity);
`);

export type Verdict = 'safe' | 'fraud';

export type StoredTransaction = {
  id: string;
  merchant: string;
  category: string;
  /** Rupees. Converted from the paise stored on disk. */
  amount: number;
  timestamp: number;
  severity: 'good' | 'warn' | 'danger';
  reasons: string;
  source: 'simulator' | 'account_aggregator' | 'sms';
  verdict?: Verdict | null;
};

type TransactionRow = Omit<StoredTransaction, 'amount'> & { amount_paise: number; user_id: string };

const toPaise = (rupees: number) => Math.round(rupees * 100);
const toRupees = (paise: number) => paise / 100;

function hydrate(row: TransactionRow): StoredTransaction {
  const { amount_paise, user_id: _userId, ...rest } = row;
  return { ...rest, amount: toRupees(amount_paise) };
}

// ---------------- users ----------------

export type User = { id: string; email: string; password_hash: string; password_salt: string; created_at: number };

export function createUser(user: User) {
  db.prepare(
    `INSERT INTO users (id, email, password_hash, password_salt, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(user.id, user.email, user.password_hash, user.password_salt, user.created_at);
}

export function findUserByEmail(email: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

export function findUserById(id: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

// ---------------- transactions ----------------

export function insertTransaction(userId: string, tx: StoredTransaction) {
  db.prepare(
    `INSERT INTO transactions (id, user_id, merchant, category, amount_paise, timestamp, severity, reasons, source, verdict)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    tx.id,
    userId,
    tx.merchant,
    tx.category,
    toPaise(tx.amount),
    tx.timestamp,
    tx.severity,
    tx.reasons,
    tx.source,
    tx.verdict ?? null
  );
}

export function listTransactions(userId: string, limit = 50): StoredTransaction[] {
  const rows = db
    .prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?')
    .all(userId, limit) as TransactionRow[];
  return rows.map(hydrate);
}

export function listFlagged(userId: string, limit = 50): StoredTransaction[] {
  const rows = db
    .prepare(`SELECT * FROM transactions WHERE user_id = ? AND severity = 'danger' ORDER BY timestamp DESC LIMIT ?`)
    .all(userId, limit) as TransactionRow[];
  return rows.map(hydrate);
}

/** Scoped by user so one account can never read or review another's rows. */
export function setVerdict(userId: string, id: string, verdict: Verdict): StoredTransaction | undefined {
  const result = db
    .prepare('UPDATE transactions SET verdict = ? WHERE id = ? AND user_id = ?')
    .run(verdict, id, userId);
  if (result.changes === 0) return undefined;

  const row = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, userId) as
    | TransactionRow
    | undefined;
  return row ? hydrate(row) : undefined;
}

/**
 * One-time import of the pre-auth flat-file store, so the history the
 * baseline already learned from isn't thrown away. Runs only if the target
 * user has no rows yet.
 */
export function migrateLegacyJson(userId: string): number {
  const legacyPath = path.join(__dirname, '..', 'fin-data.json');
  if (!fs.existsSync(legacyPath)) return 0;

  const existing = db.prepare('SELECT COUNT(*) AS n FROM transactions WHERE user_id = ?').get(userId) as { n: number };
  if (existing.n > 0) return 0;

  let rows: Array<StoredTransaction> = [];
  try {
    rows = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
  } catch {
    return 0;
  }

  const insert = db.prepare(
    `INSERT OR IGNORE INTO transactions (id, user_id, merchant, category, amount_paise, timestamp, severity, reasons, source, verdict)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const tx of rows) {
    insert.run(
      tx.id,
      userId,
      tx.merchant,
      tx.category,
      toPaise(tx.amount),
      tx.timestamp,
      tx.severity,
      typeof tx.reasons === 'string' ? tx.reasons : JSON.stringify(tx.reasons ?? []),
      tx.source,
      tx.verdict ?? null
    );
  }
  return rows.length;
}
