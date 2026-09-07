import { createContext, ReactNode, useContext, useState } from 'react';
import { LiveTransaction } from '../lib/realtimeEngine';
import { Baseline } from '../lib/backendClient';
import { SmsStatus } from '../lib/smsListener';

type SettingsState = {
  realtimeDetectionEnabled: boolean;
  setRealtimeDetectionEnabled: (value: boolean) => void;
  sensitivity: 'low' | 'medium' | 'high';
  setSensitivity: (value: 'low' | 'medium' | 'high') => void;
  liveFeed: LiveTransaction[];
  liveAlerts: LiveTransaction[];
  triggerSimulatedTransaction: () => void;
  lastScanAt: number | null;
  smsStatus: SmsStatus | null;
  dataSource: 'live' | 'local' | 'connecting';
  baseline: Baseline | null;
};

const SettingsContext = createContext<SettingsState | undefined>(undefined);

/**
 * Production app starts empty. No simulator, no SMS listener, no socket feed.
 * Books and Home only show statements the user uploads.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [realtimeDetectionEnabled, setRealtimeDetectionEnabled] = useState(false);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');

  return (
    <SettingsContext.Provider
      value={{
        realtimeDetectionEnabled,
        setRealtimeDetectionEnabled,
        sensitivity,
        setSensitivity,
        liveFeed: [],
        liveAlerts: [],
        triggerSimulatedTransaction: () => {},
        lastScanAt: null,
        smsStatus: null,
        dataSource: 'local',
        baseline: null,
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
