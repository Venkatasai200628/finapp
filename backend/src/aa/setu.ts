/**
 * Account Aggregator client (Setu sandbox) — STUB.
 *
 * This is intentionally unimplemented until you have sandbox credentials:
 *   1. Sign up at https://bridge.setu.co (free) → create a Data / Account
 *      Aggregator sandbox product → copy the Client ID + Client Secret.
 *   2. Put them in backend/.env as AA_CLIENT_ID / AA_CLIENT_SECRET.
 *   3. Implement the three calls below against Setu's AA API docs
 *      (https://docs.setu.co/data/account-aggregator/api-integration):
 *        - createConsentRequest(userMobile) → returns a consent handle + a
 *          redirect URL the user opens to approve data sharing in their AA app.
 *        - checkConsentStatus(consentHandle) → poll until status is ACTIVE.
 *        - fetchTransactions(consentId, fromDate, toDate) → pulls the
 *          actual FI (Financial Information) data once consent is active.
 *   4. Wire fetchTransactions() results through engine.scoreTransaction()
 *      and insertTransaction()/io.emit('transaction', ...) the same way
 *      simulator.ts does today, then stop calling startSimulator().
 *
 * Until this is filled in, isConfigured() returns false and index.ts keeps
 * running the built-in simulator instead.
 */

export function isConfigured(): boolean {
  return Boolean(process.env.AA_CLIENT_ID && process.env.AA_CLIENT_SECRET);
}

export async function createConsentRequest(_userMobile: string): Promise<never> {
  throw new Error('Account Aggregator integration not implemented yet — see comment at top of aa/setu.ts');
}

export async function checkConsentStatus(_consentHandle: string): Promise<never> {
  throw new Error('Account Aggregator integration not implemented yet — see comment at top of aa/setu.ts');
}

export async function fetchTransactions(_consentId: string, _fromDate: string, _toDate: string): Promise<never> {
  throw new Error('Account Aggregator integration not implemented yet — see comment at top of aa/setu.ts');
}
