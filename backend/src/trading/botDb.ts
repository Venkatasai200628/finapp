import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

/**
 * Read-only window onto the crypto trading bot's SQLite log
 * (karnati-praveen/trading-bot-, `logs/trades.db`).
 *
 * Deliberately read-only and deliberately separate from the bot's own code:
 * a monitoring surface must never be able to corrupt, lock, or alter a
 * running trading system. Nothing here places, modifies or cancels orders.
 *
 * Point TRADING_BOT_DB_PATH at the file. If the bot runs on another machine,
 * use scripts/bot_bridge.py alongside it instead — same data, pushed over HTTP.
 */

export type BotTrade = {
  id: number;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry_price: number;
  close_price: number | null;
  quantity: number;
  size_usdt: number;
  stop_loss: number | null;
  take_profit: number | null;
  entry_reason: string | null;
  pnl: number | null;
  pnl_pct: number | null;
  close_reason: string | null;
  mode: string;
  opened_at: string;
  closed_at: string | null;
  status: 'OPEN' | 'CLOSED';
};

export type BotAiDecision = {
  symbol: string;
  action: string;
  confidence: number;
  reasoning: string | null;
  risk_level: string | null;
  timestamp: string;
};

export type BotConnection =
  | { connected: false; reason: string }
  | { connected: true; path: string; mode: 'PAPER' | 'LIVE' | 'UNKNOWN' };

const DB_PATH = process.env.TRADING_BOT_DB_PATH ?? '';

function openReadOnly(): DatabaseSync | null {
  if (!DB_PATH || !fs.existsSync(DB_PATH)) return null;
  try {
    return new DatabaseSync(DB_PATH, { readOnly: true });
  } catch {
    return null;
  }
}

/** Runs a query and swallows failures — a schema drift in the bot must not
 * take down the finance backend, it should just show as "no data". */
function query<T>(sql: string, ...params: unknown[]): T[] {
  const db = openReadOnly();
  if (!db) return [];
  try {
    return db.prepare(sql).all(...(params as never[])) as T[];
  } catch {
    return [];
  } finally {
    try {
      db.close();
    } catch {
      /* already closed */
    }
  }
}

export function connectionStatus(): BotConnection {
  if (!DB_PATH) {
    return { connected: false, reason: 'TRADING_BOT_DB_PATH is not set in backend/.env' };
  }
  if (!fs.existsSync(DB_PATH)) {
    return { connected: false, reason: `No database at ${DB_PATH}` };
  }
  const db = openReadOnly();
  if (!db) return { connected: false, reason: 'Database exists but could not be opened' };
  db.close();

  const [latest] = query<{ mode: string }>('SELECT mode FROM trades ORDER BY id DESC LIMIT 1');
  const mode = latest?.mode === 'LIVE' ? 'LIVE' : latest?.mode === 'PAPER' ? 'PAPER' : 'UNKNOWN';
  return { connected: true, path: DB_PATH, mode };
}

export function openPositions(): BotTrade[] {
  return query<BotTrade>(`SELECT * FROM trades WHERE status = 'OPEN' ORDER BY opened_at DESC`);
}

export function closedTrades(limit = 100): BotTrade[] {
  return query<BotTrade>(`SELECT * FROM trades WHERE status = 'CLOSED' ORDER BY closed_at DESC LIMIT ?`, limit);
}

export function recentTrades(limit = 25): BotTrade[] {
  return query<BotTrade>(`SELECT * FROM trades ORDER BY opened_at DESC LIMIT ?`, limit);
}

export function recentAiDecisions(limit = 10): BotAiDecision[] {
  return query<BotAiDecision>(`SELECT * FROM ai_decisions ORDER BY timestamp DESC LIMIT ?`, limit);
}
