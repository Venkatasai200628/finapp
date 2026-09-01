import { Platform } from 'react-native';
import { parseTransactionSms } from './smsParser';
import { ingestTransaction } from './backendClient';

/**
 * Bridges Android's incoming-SMS stream into the detection engine.
 *
 * The native SMS package is loaded lazily and defensively: it does not exist
 * in Expo Go, on iOS, or before a development build is made. Everything here
 * degrades to `unavailable` in those cases so the rest of the app keeps
 * working — the parser and the engine are exercised by the manual test
 * screen regardless (app/sms-test.tsx).
 */

export type SmsStatus =
  | { state: 'unavailable'; reason: string }
  | { state: 'needs-permission' }
  | { state: 'listening' }
  | { state: 'error'; reason: string };

type NativeSmsModule = {
  startReadSMS: (
    onReceived: (status: string, sms: string) => void,
    onError: (error: string) => void
  ) => void;
  requestReadSMSPermission: () => Promise<boolean>;
  checkIfHasSMSPermission?: () => Promise<boolean>;
};

/**
 * iOS cannot do this at all — Apple exposes no API for reading SMS, so
 * instant transaction alerts are structurally impossible there. Those users
 * need Account Aggregator or manual entry instead.
 */
function loadNativeModule(): NativeSmsModule | null {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@maniac-tech/react-native-expo-read-sms') as NativeSmsModule;
  } catch {
    return null;
  }
}

export function isSmsCaptureSupported(): boolean {
  return Platform.OS === 'android' && loadNativeModule() !== null;
}

/**
 * Parses one SMS body and, if it's a real transaction, sends it to the
 * engine. Exported so the manual test screen runs the identical path a real
 * incoming message would.
 */
export async function handleIncomingSms(
  token: string | null,
  body: string
): Promise<{ ingested: boolean; detail: string }> {
  const parsed = parseTransactionSms(body);
  if (!parsed) {
    return { ingested: false, detail: 'Not a transaction message — ignored.' };
  }

  // Low-confidence parses are almost always a format we don't handle well.
  // Sending them would produce junk merchants and bogus alerts.
  if (parsed.confidence < 0.5) {
    return { ingested: false, detail: `Parsed too weakly (confidence ${parsed.confidence}) — ignored.` };
  }

  const ok = token
    ? await ingestTransaction(token, {
        merchant: parsed.merchant,
        category: parsed.category,
        amount: parsed.amount,
        timestamp: Date.now(),
        source: 'sms',
      })
    : false;

  const sign = parsed.amount < 0 ? '−' : '+';
  const summary = `${sign}₹${Math.abs(parsed.amount).toLocaleString('en-IN')} · ${parsed.merchant} · ${parsed.category}`;
  return {
    ingested: ok,
    detail: ok ? `Sent to engine: ${summary}` : `Parsed ${summary}, but the engine is unreachable.`,
  };
}

export async function startSmsCapture(
  getToken: () => string | null,
  onStatus: (status: SmsStatus) => void
): Promise<void> {
  if (Platform.OS === 'ios') {
    onStatus({ state: 'unavailable', reason: 'iOS does not allow apps to read SMS. Use Account Aggregator instead.' });
    return;
  }

  const native = loadNativeModule();
  if (!native) {
    onStatus({
      state: 'unavailable',
      reason: 'Needs a development build — SMS permissions are not available in Expo Go.',
    });
    return;
  }

  try {
    const granted = await native.requestReadSMSPermission();
    if (!granted) {
      onStatus({ state: 'needs-permission' });
      return;
    }

    native.startReadSMS(
      (_status, sms) => {
        // Fire and forget: a slow or failed round-trip must never block the
        // native callback, or later messages get dropped. The token is read
        // at call time so a re-login doesn't leave a stale one captured.
        void handleIncomingSms(getToken(), sms);
      },
      (error) => onStatus({ state: 'error', reason: String(error) })
    );

    onStatus({ state: 'listening' });
  } catch (error) {
    onStatus({ state: 'error', reason: error instanceof Error ? error.message : String(error) });
  }
}
