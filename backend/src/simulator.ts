import { Server } from 'socket.io';
import { computeBaseline } from './baseline';
import { generateRawTransaction, RawTransaction, scoreTransaction } from './engine';
import { insertTransaction } from './db';

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Produces one transaction: generate a raw event, score it against the
 * CURRENT learned baseline, store it, and push it to every connected client.
 * Exported so the manual "Run" button in the app goes through the exact
 * same path as the automatic ticker.
 */
export function emitTransaction(io: Server) {
  return ingestTransaction(io, generateRawTransaction());
}

/**
 * Scores, stores and broadcasts one transaction, whatever produced it.
 * A parsed bank SMS from a phone and a simulated event go through this
 * exact same path — the detection never knows or cares which it was.
 */
export function ingestTransaction(io: Server, raw: RawTransaction) {
  const event = scoreTransaction(raw, computeBaseline());
  insertTransaction({ ...event, reasons: JSON.stringify(event.reasons) });
  io.emit('transaction', event);
  io.emit('baseline', computeBaseline());
  return event;
}

/**
 * Stand-in for a real event source. Runs only while no Account Aggregator
 * client is configured (see aa/setu.ts).
 */
export function startSimulator(io: Server, intervalMs: number) {
  const tick = () => {
    emitTransaction(io);
    const jitter = intervalMs * 0.4 * (Math.random() - 0.5);
    timer = setTimeout(tick, intervalMs + jitter);
  };
  tick();
}

export function stopSimulator() {
  if (timer) clearTimeout(timer);
  timer = null;
}
