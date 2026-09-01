import { Server } from 'socket.io';
import { computeBaseline } from './baseline';
import { generateRawTransaction, RawTransaction, scoreTransaction } from './engine';
import { insertTransaction } from './db';

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Scores, stores and broadcasts one transaction for one user, whatever
 * produced it. A parsed bank SMS from a phone and a simulated event go
 * through this exact same path — detection never knows which it was.
 *
 * Emission is scoped to the user's own socket room, so one account's
 * transactions can never surface in another's feed.
 */
export function ingestTransaction(io: Server, userId: string, raw: RawTransaction) {
  const event = scoreTransaction(raw, computeBaseline(userId));
  insertTransaction(userId, { ...event, reasons: JSON.stringify(event.reasons) });
  io.to(userId).emit('transaction', event);
  io.to(userId).emit('baseline', computeBaseline(userId));
  return event;
}

export function emitTransaction(io: Server, userId: string) {
  return ingestTransaction(io, userId, generateRawTransaction());
}

/**
 * Demo data generator, per user. Only runs while a user actually has a
 * client connected — there's no point inventing transactions for accounts
 * nobody is watching, and it would quietly bloat their history.
 */
export function startSimulator(io: Server, userId: string, intervalMs: number) {
  if (timers.has(userId)) return;

  const tick = () => {
    emitTransaction(io, userId);
    const jitter = intervalMs * 0.4 * (Math.random() - 0.5);
    timers.set(userId, setTimeout(tick, intervalMs + jitter));
  };
  tick();
}

export function stopSimulator(userId: string) {
  const timer = timers.get(userId);
  if (timer) clearTimeout(timer);
  timers.delete(userId);
}
