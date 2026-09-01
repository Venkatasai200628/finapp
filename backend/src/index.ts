import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { transactionsRouter } from './routes/transactions';
import { startSimulator } from './simulator';
import { generateTransactionEvent } from './engine';
import { insertTransaction, listTransactions } from './db';
import { isConfigured as aaConfigured } from './aa/setu';

const PORT = Number(process.env.PORT) || 4000;
const SIMULATOR_INTERVAL_MS = Number(process.env.SIMULATOR_INTERVAL_MS) || 8000;

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', transactionsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dataSource: aaConfigured() ? 'account_aggregator' : 'simulator' });
});

// Manually trigger one event on demand (used by the app's "Run" button in Settings)
app.post('/api/simulate', (_req, res) => {
  const event = generateTransactionEvent();
  insertTransaction({ ...event, reasons: JSON.stringify(event.reasons) });
  io.emit('transaction', event);
  res.json(event);
});

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  // Replay recent history so a freshly-connected client isn't empty.
  socket.emit(
    'history',
    listTransactions(20).map((tx) => ({ ...tx, reasons: JSON.parse(tx.reasons) }))
  );
});

httpServer.listen(PORT, () => {
  const source = aaConfigured() ? 'Account Aggregator (not yet implemented — see aa/setu.ts)' : 'built-in simulator';
  console.log(`fin-backend listening on http://localhost:${PORT}`);
  console.log(`Data source: ${source}`);

  if (!aaConfigured()) {
    startSimulator(io, SIMULATOR_INTERVAL_MS);
  }
});
