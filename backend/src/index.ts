import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createTransactionsRouter } from './routes/transactions';
import { authRouter } from './routes/auth';
import { AuthedRequest, requireAuth, userIdFromToken, usingEphemeralSecret } from './auth';
import { startSimulator, stopSimulator, emitTransaction, ingestTransaction } from './simulator';
import { computeBaseline } from './baseline';
import { listTransactions } from './db';
import { isConfigured as aaConfigured } from './aa/setu';

const PORT = Number(process.env.PORT) || 4000;
const SIMULATOR_INTERVAL_MS = Number(process.env.SIMULATOR_INTERVAL_MS) || 8000;
const SIMULATOR_ENABLED = process.env.SIMULATOR_ENABLED !== 'false';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json({ limit: '64kb' }));
// Public. Must precede the authed routers below: their router-level
// requireAuth applies to every path under the shared /api mount, so a
// public route declared after them never runs.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dataSource: aaConfigured() ? 'account_aggregator' : 'simulator' });
});

app.use('/api', authRouter);
app.use('/api', createTransactionsRouter(io));

// Manually trigger one demo event (the app's "Run" button in Settings).
app.post('/api/simulate', requireAuth, (req: AuthedRequest, res) => {
  res.json(emitTransaction(io, req.userId!));
});

/**
 * Real transactions parsed on a phone (from bank SMS) land here.
 * The raw SMS text is deliberately NOT accepted or stored — parsing happens
 * on-device, so message contents never reach the server.
 */
app.post('/api/ingest', requireAuth, (req: AuthedRequest, res) => {
  const { merchant, category, amount, timestamp, source } = req.body ?? {};

  if (typeof merchant !== 'string' || !merchant.trim()) {
    return res.status(400).json({ error: 'merchant is required' });
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) {
    return res.status(400).json({ error: 'amount must be a non-zero number' });
  }
  if (source !== 'sms' && source !== 'account_aggregator') {
    return res.status(400).json({ error: "source must be 'sms' or 'account_aggregator'" });
  }

  const event = ingestTransaction(io, req.userId!, {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    merchant: merchant.trim().slice(0, 60),
    category: typeof category === 'string' && category.trim() ? category.trim().slice(0, 40) : 'Uncategorized',
    amount,
    timestamp: typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : Date.now(),
    source,
  });

  res.json(event);
});

// Sockets carry per-user data, so they authenticate exactly like the REST API.
io.use((socket, next) => {
  const token = (socket.handshake.auth?.token as string | undefined) ?? '';
  const userId = token ? userIdFromToken(token) : null;
  if (!userId) return next(new Error('unauthorized'));
  socket.data.userId = userId;
  next();
});

io.on('connection', (socket) => {
  const userId = socket.data.userId as string;
  // A room per user is what keeps one account's stream out of another's.
  socket.join(userId);

  socket.emit(
    'history',
    listTransactions(userId, 20).map((tx) => ({ ...tx, reasons: JSON.parse(tx.reasons) }))
  );
  socket.emit('baseline', computeBaseline(userId));

  if (SIMULATOR_ENABLED && !aaConfigured()) {
    startSimulator(io, userId, SIMULATOR_INTERVAL_MS);
  }

  socket.on('disconnect', async () => {
    const remaining = await io.in(userId).fetchSockets();
    if (remaining.length === 0) stopSimulator(userId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`fin-backend listening on http://localhost:${PORT}`);
  console.log(`Data source: ${aaConfigured() ? 'Account Aggregator' : 'built-in simulator'}`);
  if (usingEphemeralSecret) {
    console.log('WARNING: JWT_SECRET not set — tokens are signed with a random per-boot key and');
    console.log('         every restart signs users out. Set JWT_SECRET before deploying.');
  }
});
