import { Router } from 'express';
import { Server } from 'socket.io';
import { listTransactions, listFlagged, setVerdict, StoredTransaction } from '../db';
import { computeBaseline } from '../baseline';

function parse(tx: StoredTransaction) {
  return { ...tx, reasons: JSON.parse(tx.reasons) };
}

export function createTransactionsRouter(io: Server) {
  const router = Router();

  router.get('/transactions', (req, res) => {
    const limit = Number(req.query.limit) || 50;
    res.json(listTransactions(limit).map(parse));
  });

  router.get('/alerts', (req, res) => {
    const limit = Number(req.query.limit) || 20;
    res.json(listFlagged(limit).map(parse));
  });

  /** What the engine currently believes "normal" looks like for this user. */
  router.get('/baseline', (_req, res) => {
    res.json(computeBaseline());
  });

  /**
   * Records the user's review of a flagged transaction. This is the feedback
   * loop: the verdict changes whether the transaction is allowed to teach the
   * baseline (see isLearnable in baseline.ts), so the next computeBaseline()
   * reflects it — and every connected client is told about the new profile.
   */
  router.post('/transactions/:id/verdict', (req, res) => {
    const { verdict } = req.body ?? {};
    if (verdict !== 'safe' && verdict !== 'fraud') {
      return res.status(400).json({ error: "verdict must be 'safe' or 'fraud'" });
    }

    const updated = setVerdict(req.params.id, verdict);
    if (!updated) return res.status(404).json({ error: 'transaction not found' });

    const baseline = computeBaseline();
    io.emit('baseline', baseline);
    res.json({ transaction: parse(updated), baseline });
  });

  return router;
}
