import { Server } from 'socket.io';
import { generateTransactionEvent } from './engine';
import { insertTransaction } from './db';

let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Stand-in for a real event source. Runs only while no Account Aggregator
 * client is configured (see aa/setu.ts) — swap this out once AA_CLIENT_ID
 * is set in .env and pollAccountAggregator() takes over emitting events.
 */
export function startSimulator(io: Server, intervalMs: number) {
  const tick = () => {
    const event = generateTransactionEvent();
    insertTransaction({ ...event, reasons: JSON.stringify(event.reasons) });
    io.emit('transaction', event);

    const jitter = intervalMs * 0.4 * (Math.random() - 0.5);
    timer = setTimeout(tick, intervalMs + jitter);
  };
  tick();
}

export function stopSimulator() {
  if (timer) clearTimeout(timer);
  timer = null;
}
