import { BotTrade, closedTrades, openPositions } from './botDb';

/**
 * Applies this app's core idea — "compare against what's normal for you,
 * flag the deviation" — to the trading bot's own behavior.
 *
 * Note what this deliberately does NOT do: it never predicts price, never
 * judges whether a trade was a good idea, and never suggests an action. It
 * only answers "is the bot behaving unlike itself", which is a reason to
 * look, not a trading signal.
 */

export type TradingSeverity = 'good' | 'warn' | 'danger';

export type TradingFlag = {
  id: string;
  severity: TradingSeverity;
  title: string;
  detail: string;
};

export type TradingSummary = {
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

export type SymbolExposure = { symbol: string; exposure: number; share: number };

function mean(values: number[]) {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}

function stdDeviation(values: number[], avg: number) {
  if (values.length < 2) return 0;
  return Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1));
}

/**
 * Peak-to-trough decline of the cumulative P&L curve, oldest trade first.
 * Reported as a positive number of USDT lost from the running peak.
 */
function maxDrawdown(pnlsOldestFirst: number[]): number {
  let equity = 0;
  let peak = 0;
  let worst = 0;
  for (const pnl of pnlsOldestFirst) {
    equity += pnl;
    peak = Math.max(peak, equity);
    worst = Math.max(worst, peak - equity);
  }
  return worst;
}

function streak(pnlsNewestFirst: number[]): TradingSummary['currentStreak'] {
  if (pnlsNewestFirst.length === 0) return { kind: 'none', count: 0 };
  const kind = pnlsNewestFirst[0] >= 0 ? 'win' : 'loss';
  let count = 0;
  for (const pnl of pnlsNewestFirst) {
    const isWin = pnl >= 0;
    if ((kind === 'win') !== isWin) break;
    count++;
  }
  return { kind, count };
}

export function summarise(): TradingSummary {
  const closed = closedTrades(200);
  const open = openPositions();
  const pnls = closed.map((t) => t.pnl ?? 0);
  const pcts = closed.map((t) => t.pnl_pct ?? 0);
  const wins = pnls.filter((p) => p > 0).length;
  const losses = pnls.filter((p) => p < 0).length;

  return {
    totalTrades: closed.length,
    wins,
    losses,
    winRate: closed.length ? Math.round((wins / closed.length) * 100) : 0,
    totalPnl: Number(pnls.reduce((s, p) => s + p, 0).toFixed(2)),
    avgPnlPct: Number(mean(pcts).toFixed(2)),
    openCount: open.length,
    openExposure: Number(open.reduce((s, t) => s + (t.size_usdt ?? 0), 0).toFixed(2)),
    bestTrade: pnls.length ? Number(Math.max(...pnls).toFixed(2)) : 0,
    worstTrade: pnls.length ? Number(Math.min(...pnls).toFixed(2)) : 0,
    currentStreak: streak(pnls),
    // closedTrades() returns newest-first, so reverse for the equity walk.
    maxDrawdown: Number(maxDrawdown([...pnls].reverse()).toFixed(2)),
  };
}

export function symbolExposure(): SymbolExposure[] {
  const open = openPositions();
  const total = open.reduce((s, t) => s + (t.size_usdt ?? 0), 0);
  if (total === 0) return [];

  const bySymbol = new Map<string, number>();
  for (const t of open) {
    bySymbol.set(t.symbol, (bySymbol.get(t.symbol) ?? 0) + (t.size_usdt ?? 0));
  }

  return [...bySymbol.entries()]
    .map(([symbol, exposure]) => ({
      symbol,
      exposure: Number(exposure.toFixed(2)),
      share: Math.round((exposure / total) * 100),
    }))
    .sort((a, b) => b.exposure - a.exposure);
}

const CONCENTRATION_WARN = 60;
const CONCENTRATION_DANGER = 80;
const LOSS_STREAK_WARN = 3;
const LOSS_STREAK_DANGER = 5;
const SIZE_DEVIATION_SIGMA = 2.5;

export function behaviorFlags(): TradingFlag[] {
  const flags: TradingFlag[] = [];
  const closed = closedTrades(200);
  const open = openPositions();

  // --- Position size unlike its own history ---
  const historicalSizes = closed.map((t) => t.size_usdt ?? 0).filter((s) => s > 0);
  if (historicalSizes.length >= 8 && open.length > 0) {
    const avg = mean(historicalSizes);
    const sd = stdDeviation(historicalSizes, avg);
    if (sd > 0) {
      for (const position of open) {
        const z = ((position.size_usdt ?? 0) - avg) / sd;
        if (z > SIZE_DEVIATION_SIGMA) {
          flags.push({
            id: `size-${position.id}`,
            severity: 'danger',
            title: `Oversized position in ${position.symbol}`,
            detail: `$${position.size_usdt.toFixed(0)} is ${(position.size_usdt / avg).toFixed(1)}x the bot's average position of $${avg.toFixed(0)}.`,
          });
        }
      }
    }
  }

  // --- Concentration: one symbol dominating open exposure ---
  const exposure = symbolExposure();
  const top = exposure[0];
  if (top && exposure.length > 0 && top.share >= CONCENTRATION_WARN) {
    flags.push({
      id: `concentration-${top.symbol}`,
      severity: top.share >= CONCENTRATION_DANGER ? 'danger' : 'warn',
      title: `${top.share}% of exposure in ${top.symbol}`,
      detail:
        exposure.length === 1
          ? 'All open risk sits in a single symbol, so one adverse move hits the whole book.'
          : `Concentrated across ${exposure.length} open symbols, weighted heavily toward ${top.symbol}.`,
    });
  }

  // --- Losing streak: the classic precursor to revenge trading ---
  const current = streak(closed.map((t) => t.pnl ?? 0));
  if (current.kind === 'loss' && current.count >= LOSS_STREAK_WARN) {
    flags.push({
      id: 'loss-streak',
      severity: current.count >= LOSS_STREAK_DANGER ? 'danger' : 'warn',
      title: `${current.count} losing trades in a row`,
      detail: 'Worth checking whether market conditions changed rather than letting the streak run.',
    });
  }

  // --- Trading frequency spike vs. its own recent norm ---
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const last24h = closed.filter((t) => t.closed_at && now - Date.parse(t.closed_at) < dayMs).length;
  const prior7dPerDay =
    closed.filter((t) => {
      if (!t.closed_at) return false;
      const age = now - Date.parse(t.closed_at);
      return age >= dayMs && age < 8 * dayMs;
    }).length / 7;

  if (prior7dPerDay >= 1 && last24h > prior7dPerDay * 3) {
    flags.push({
      id: 'frequency',
      severity: 'warn',
      title: 'Trading far more often than usual',
      detail: `${last24h} trades in 24h against a recent average of ${prior7dPerDay.toFixed(1)}/day.`,
    });
  }

  return flags;
}

export function equityCurve(points = 60): number[] {
  const pnls = closedTrades(points)
    .map((t) => t.pnl ?? 0)
    .reverse();
  let equity = 0;
  return pnls.map((pnl) => {
    equity += pnl;
    return Number(equity.toFixed(2));
  });
}

export type { BotTrade };
