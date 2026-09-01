import { Router } from 'express';
import { listTransactions, listFlagged } from '../db';

export const transactionsRouter = Router();

function parse(tx: ReturnType<typeof listTransactions>[number]) {
  return { ...tx, reasons: JSON.parse(tx.reasons) };
}

transactionsRouter.get('/transactions', (req, res) => {
  const limit = Number(req.query.limit) || 50;
  res.json(listTransactions(limit).map(parse));
});

transactionsRouter.get('/alerts', (req, res) => {
  const limit = Number(req.query.limit) || 20;
  res.json(listFlagged(limit).map(parse));
});
