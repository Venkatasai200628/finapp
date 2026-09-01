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

export function createBackendSocket(): Socket | null {
  if (!BACKEND_URL) return null;
  return io(BACKEND_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 3,
    timeout: 3000,
  });
}

export async function simulateOnBackend(): Promise<boolean> {
  if (!BACKEND_URL) return false;
  try {
    const res = await fetch(`${BACKEND_URL}/api/simulate`, { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
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
export async function submitVerdict(id: string, verdict: 'safe' | 'fraud'): Promise<boolean> {
  if (!BACKEND_URL) return false;
  try {
    const res = await fetch(`${BACKEND_URL}/api/transactions/${encodeURIComponent(id)}/verdict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verdict }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
