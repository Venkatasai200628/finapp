import { Router } from 'express';
import { Server } from 'socket.io';
import { listTransactions, listFlagged, setVerdict, StoredTransaction } from '../db';
import { computeBaseline } from '../baseline';
import { AuthedRequest, requireAuth } from '../auth';

function parse(tx: StoredTransaction) {
  return { ...tx, reasons: JSON.parse(tx.reasons) };
}

export function createTransactionsRouter(io: Server) {
  const router = Router();

  // Every route below is per-user; nothing here is reachable unauthenticated.
  router.use(requireAuth);

  router.get('/transactions', (req: AuthedRequest, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    res.json(listTransactions(req.userId!, limit).map(parse));
  });

  router.get('/alerts', (req: AuthedRequest, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json(listFlagged(req.userId!, limit).map(parse));
  });

  /** What the engine currently believes "normal" looks like for this user. */
  router.get('/baseline', (req: AuthedRequest, res) => {
    res.json(computeBaseline(req.userId!));
  });

  /**
   * Records the user's review of a flagged transaction. The verdict controls
   * whether that transaction may teach the baseline (see isLearnable), so
   * confirmed fraud can never widen what counts as normal.
   */
  router.post('/transactions/:id/verdict', (req: AuthedRequest, res) => {
    const { verdict } = req.body ?? {};
    if (verdict !== 'safe' && verdict !== 'fraud') {
      return res.status(400).json({ error: "verdict must be 'safe' or 'fraud'" });
    }

    const updated = setVerdict(req.userId!, req.params.id, verdict);
    if (!updated) return res.status(404).json({ error: 'transaction not found' });

    const baseline = computeBaseline(req.userId!);
    io.to(req.userId!).emit('baseline', baseline);
    res.json({ transaction: parse(updated), baseline });
  });

  return router;
}
