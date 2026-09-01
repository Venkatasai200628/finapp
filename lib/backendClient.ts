import { io, Socket } from 'socket.io-client';

// Set EXPO_PUBLIC_BACKEND_URL in a .env file to point at your running
// backend (see backend/README.md). On a physical device this must be your
// machine's LAN IP, not "localhost" — the phone can't resolve your laptop's
// localhost. Left unset, the app falls back to its own on-device simulation
// so it still works standalone with no backend running.
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

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
  learnedFrom: number;
  isLearned: boolean;
};

/**
 * The socket carries per-user data, so it authenticates during the
 * handshake — the server rejects the connection outright without a token.
 */
export function createBackendSocket(token: string): Socket | null {
  if (!BACKEND_URL || !token) return null;
  return io(BACKEND_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 3,
    timeout: 3000,
    auth: { token },
  });
}

// ---- Trading bot monitoring (read-only) ----

export type TradingFlag = { id: string; severity: 'good' | 'warn' | 'danger'; title: string; detail: string };

export type TradingStatus = {
  connection: { connected: false; reason: string } | { connected: true; path: string; mode: 'PAPER' | 'LIVE' | 'UNKNOWN' };
  summary?: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPnl: number;
    avgPnlPct: number;
    openCount: number;
    openExposure: number;
    bestTrade: number;
    worstTrade: number;
    currentStreak: { kind: 'win' | 'loss' | 'none'; count: number };
    maxDrawdown: number;
  };
  exposure?: Array<{ symbol: string; exposure: number; share: number }>;
  flags?: TradingFlag[];
  equity?: number[];
  openPositions?: Array<{
    id: number;
    symbol: string;
    direction: string;
    entry_price: number;
    size_usdt: number;
    stop_loss: number | null;
    take_profit: number | null;
    entry_reason: string | null;
    opened_at: string;
  }>;
};

export async function fetchTradingStatus(token: string): Promise<TradingStatus | null> {
  if (!BACKEND_URL || !token) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/trading/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as TradingStatus;
  } catch {
    return null;
  }
}

/** Every data request is authenticated; the caller supplies the token. */
async function authedPost(path: string, token: string, body?: unknown): Promise<Response | null> {
  if (!BACKEND_URL || !token) return null;
  try {
    return await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

export async function simulateOnBackend(token: string): Promise<boolean> {
  const res = await authedPost('/api/simulate', token);
  return Boolean(res?.ok);
}

/**
 * Sends a real transaction (parsed on-device from a bank SMS) to the engine.
 * Only the structured result is sent — the SMS text itself never leaves the
 * phone.
 */
export async function ingestTransaction(
  token: string,
  tx: {
    merchant: string;
    category: string;
    amount: number;
    timestamp: number;
    source: 'sms' | 'account_aggregator';
  }
): Promise<boolean> {
  const res = await authedPost('/api/ingest', token, tx);
  return Boolean(res?.ok);
}

/**
 * Sends the user's review of a flagged transaction to the engine. A 'safe'
 * verdict lets that transaction start teaching the baseline; 'fraud'
 * permanently excludes it, so reporting fraud can never widen what the
 * detector considers normal.
 *
 * Returns false when there's no backend (local fallback mode) — the caller
 * should still update its own UI in that case.
 */
export async function submitVerdict(token: string, id: string, verdict: 'safe' | 'fraud'): Promise<boolean> {
  const res = await authedPost(`/api/transactions/${encodeURIComponent(id)}/verdict`, token, { verdict });
  return Boolean(res?.ok);
}
