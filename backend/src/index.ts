import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createTransactionsRouter } from './routes/transactions';
import { startSimulator, emitTransaction } from './simulator';
import { computeBaseline } from './baseline';
import { listTransactions } from './db';
import { isConfigured as aaConfigured } from './aa/setu';

const PORT = Number(process.env.PORT) || 4000;
const SIMULATOR_INTERVAL_MS = Number(process.env.SIMULATOR_INTERVAL_MS) || 8000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/api', createTransactionsRouter(io));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dataSource: aaConfigured() ? 'account_aggregator' : 'simulator' });
});

// Manually trigger one event on demand (the app's "Run" button in Settings).
app.post('/api/simulate', (_req, res) => {
  res.json(emitTransaction(io));
});

io.on('connection', (socket) => {
  // Replay recent history and the current profile so a freshly-connected
  // client isn't empty and knows what "normal" currently means.
  socket.emit(
    'history',
    listTransactions(20).map((tx) => ({ ...tx, reasons: JSON.parse(tx.reasons) }))
  );
  socket.emit('baseline', computeBaseline());
});

httpServer.listen(PORT, () => {
  const source = aaConfigured() ? 'Account Aggregator (not yet implemented — see aa/setu.ts)' : 'built-in simulator';
  const baseline = computeBaseline();
  console.log(`fin-backend listening on http://localhost:${PORT}`);
  console.log(`Data source: ${source}`);
  console.log(
    baseline.isLearned
      ? `Baseline: learned from ${baseline.learnedFrom} transactions`
      : `Baseline: seed defaults (${baseline.learnedFrom} transactions so far, need 12 to start learning)`
  );

  if (!aaConfigured()) {
    startSimulator(io, SIMULATOR_INTERVAL_MS);
  }
});
