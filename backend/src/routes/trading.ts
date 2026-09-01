import { Router } from 'express';
import { requireAuth } from '../auth';
import { connectionStatus, openPositions, recentTrades, recentAiDecisions } from '../trading/botDb';
import { behaviorFlags, equityCurve, summarise, symbolExposure } from '../trading/analysis';

/**
 * Read-only monitoring of the trading bot. There is deliberately no endpoint
 * here that opens, closes or alters a position — this surface observes, it
 * does not trade.
 */
export const tradingRouter = Router();

tradingRouter.use(requireAuth);

tradingRouter.get('/trading/status', (_req, res) => {
  const connection = connectionStatus();
  if (!connection.connected) return res.json({ connection });

  res.json({
    connection,
    summary: summarise(),
    exposure: symbolExposure(),
    flags: behaviorFlags(),
    equity: equityCurve(),
    openPositions: openPositions(),
  });
});

tradingRouter.get('/trading/trades', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  res.json(recentTrades(limit));
});

tradingRouter.get('/trading/ai-decisions', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  res.json(recentAiDecisions(limit));
});
