# fin-backend

The real-time server for the app. Generates/scores transaction events and
pushes them to the mobile/web app over a WebSocket (Socket.IO), instead of
the app faking everything on-device.

## Run it

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Server starts on `http://localhost:4000`. Check `http://localhost:4000/api/health`.

Then point the app at it — in the project root, set (or create) `.env`:

```
EXPO_PUBLIC_BACKEND_URL=http://localhost:4000
```

Restart `npm run web` / `npm start` after changing that file (Expo only reads
env vars at startup). On a physical phone with Expo Go, `localhost` won't
resolve to your laptop — use your machine's LAN IP instead, e.g.
`http://192.168.1.23:4000`, and make sure your phone and laptop are on the
same network.

## What's real here vs. still a stand-in

- **Real**: the client-server architecture. A separate process generates
  events, scores them, stores them, and pushes them to every connected app
  instance over a live socket — this is an actual real-time system, not a
  `setInterval` inside the app.
- **Still simulated**: *where the transactions come from*. `src/engine.ts`
  generates them randomly (same logic that used to live in the app). Nothing
  is connected to a real bank yet.

## Wiring up real bank data (Account Aggregator)

1. Sign up for a free sandbox account at **https://bridge.setu.co** → Data
   products → Account Aggregator. No business registration needed for the
   sandbox tier.
2. Copy your sandbox Client ID / Client Secret into `backend/.env`:
   ```
   AA_CLIENT_ID=...
   AA_CLIENT_SECRET=...
   ```
3. Implement the three stub functions in `src/aa/setu.ts` against Setu's API
   docs (https://docs.setu.co/data/account-aggregator/api-integration):
   `createConsentRequest`, `checkConsentStatus`, `fetchTransactions`.
4. Feed whatever `fetchTransactions` returns through `scoreTransaction()` in
   `src/engine.ts`, then `insertTransaction()` + `io.emit('transaction', ...)`
   the same way `src/simulator.ts` does today.
5. Once `AA_CLIENT_ID`/`AA_CLIENT_SECRET` are set, `src/index.ts` stops
   starting the built-in simulator automatically (see `isConfigured()`).

**Important**: Account Aggregator is *pull-based* — your backend asks for
data, it isn't pushed to you the instant a transaction happens. For truly
instant alerts, use the SMS path below instead (Android only).

## Real transactions via bank SMS (Android)

This is the only route that is genuinely real-time and captures every UPI
app at once. You never integrate with PhonePe/GPay/Navi — they all debit a
bank account, and the *bank* sends the SMS, so parsing bank SMS covers all
of them including apps installed later.

Pipeline: `lib/smsParser.ts` (on-device) → `POST /api/ingest` →
`scoreTransaction()` → socket broadcast. The raw SMS body never leaves the
phone; only `{merchant, category, amount}` is sent.

- **Parser**: `lib/smsParser.ts`, covering HDFC / SBI / ICICI / Axis formats
  plus card swipes, with explicit rejection of OTPs, due-date reminders,
  failed transactions and collect requests. Tests: `npx tsx lib/smsParser.test.ts`
- **Test screen**: Settings → "Bank SMS detection" lets you paste any SMS
  and watch it parse and score. This works in Expo Go, so you can verify the
  whole pipeline before dealing with native builds.
- **Automatic capture** needs a development build (Expo Go cannot grant SMS
  permissions):
  ```bash
  npx expo install @maniac-tech/react-native-expo-read-sms
  npx eas build --profile development --platform android
  ```
  `lib/smsListener.ts` loads that package defensively, so the app runs fine
  before you install it.

**iOS cannot do this.** Apple exposes no API for reading SMS, so instant
detection is impossible there — iOS users need Account Aggregator or manual
entry. Plan for that rather than being surprised by it.

**Google Play** treats `READ_SMS` as a restricted permission. Sideloading a
dev build to your own device is unrestricted; publishing requires a
declaration and review.

## Storage

Currently a flat JSON file (`fin-data.json`, gitignored) — zero setup, fine
for a single-process dev server. `better-sqlite3` was tried first but needs
native compilation (Visual Studio Build Tools), which isn't installed here.
For production, swap `src/db.ts` for a real database (Postgres via Prisma is
a natural next step) without touching any other file — every other module
only calls `insertTransaction` / `listTransactions` / `listFlagged`.
