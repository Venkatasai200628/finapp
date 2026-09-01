import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { generateTransactionEvent, LiveTransaction } from '../lib/realtimeEngine';
import { Baseline, BACKEND_URL, createBackendSocket, simulateOnBackend } from '../lib/backendClient';

type SettingsState = {
  realtimeDetectionEnabled: boolean;
  setRealtimeDetectionEnabled: (value: boolean) => void;
  sensitivity: 'low' | 'medium' | 'high';
  setSensitivity: (value: 'low' | 'medium' | 'high') => void;
  liveFeed: LiveTransaction[];
  liveAlerts: LiveTransaction[];
  triggerSimulatedTransaction: () => void;
  lastScanAt: number | null;
  /** 'live' = events are streaming from the real backend over WebSocket.
   *  'local' = no backend configured/reachable, running the on-device fallback simulation. */
  dataSource: 'live' | 'local' | 'connecting';
  /** What the engine has learned "normal" looks like. Null in local fallback mode. */
  baseline: Baseline | null;
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

const SENSITIVITY_INTERVAL: Record<'low' | 'medium' | 'high', number> = {
  low: 14000,
  medium: 9000,
  high: 5000,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [realtimeDetectionEnabled, setRealtimeDetectionEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [liveFeed, setLiveFeed] = useState<LiveTransaction[]>([]);
  const [lastScanAt, setLastScanAt] = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<'live' | 'local' | 'connecting'>(BACKEND_URL ? 'connecting' : 'local');
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const pushEvent = useCallback((event: LiveTransaction) => {
    setLastScanAt(Date.now());
    setLiveFeed((prev) => [event, ...prev].slice(0, 25));
  }, []);

  // --- Real backend connection, when EXPO_PUBLIC_BACKEND_URL is set ---
  useEffect(() => {
    const socket = createBackendSocket();
    if (!socket) {
      setDataSource('local');
      return;
    }
    socketRef.current = socket;

    socket.on('connect', () => setDataSource('live'));
    socket.on('disconnect', () => setDataSource('local'));
    socket.on('connect_error', () => setDataSource('local'));
    socket.on('history', (rows: LiveTransaction[]) => {
      setLiveFeed((prev) => (prev.length ? prev : rows.slice(0, 25)));
    });
    socket.on('transaction', (event: LiveTransaction) => pushEvent(event));
    socket.on('baseline', (next: Baseline) => setBaseline(next));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerSimulatedTransaction = useCallback(async () => {
    if (dataSource === 'live') {
      const ok = await simulateOnBackend();
      if (ok) return; // the server will emit the event back over the socket
    }
    pushEvent(generateTransactionEvent());
  }, [dataSource, pushEvent]);

  // --- On-device fallback simulation, only when there is no live backend ---
  useEffect(() => {
    if (!realtimeDetectionEnabled || dataSource === 'live') {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const schedule = () => {
      const base = SENSITIVITY_INTERVAL[sensitivity];
      const jitter = base * 0.4 * (Math.random() - 0.5);
      timerRef.current = setTimeout(() => {
        pushEvent(generateTransactionEvent());
        schedule();
      }, base + jitter);
    };
    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [realtimeDetectionEnabled, sensitivity, pushEvent, dataSource]);

  const liveAlerts = liveFeed.filter((e) => e.severity === 'danger');

  return (
    <SettingsContext.Provider
      value={{
        realtimeDetectionEnabled,
        setRealtimeDetectionEnabled,
        sensitivity,
        setSensitivity,
        liveFeed,
        liveAlerts,
        triggerSimulatedTransaction,
        lastScanAt,
        dataSource,
        baseline,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
