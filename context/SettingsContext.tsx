import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { generateTransactionEvent, LiveTransaction } from '../lib/realtimeEngine';

type SettingsState = {
  realtimeDetectionEnabled: boolean;
  setRealtimeDetectionEnabled: (value: boolean) => void;
  sensitivity: 'low' | 'medium' | 'high';
  setSensitivity: (value: 'low' | 'medium' | 'high') => void;
  liveFeed: LiveTransaction[];
  liveAlerts: LiveTransaction[];
  triggerSimulatedTransaction: () => void;
  lastScanAt: number | null;
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushEvent = useCallback((event: LiveTransaction) => {
    setLastScanAt(Date.now());
    setLiveFeed((prev) => [event, ...prev].slice(0, 25));
  }, []);

  const triggerSimulatedTransaction = useCallback(() => {
    pushEvent(generateTransactionEvent());
  }, [pushEvent]);

  useEffect(() => {
    if (!realtimeDetectionEnabled) {
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
  }, [realtimeDetectionEnabled, sensitivity, pushEvent]);

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
