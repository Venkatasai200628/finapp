# Building a real installable APK

EAS Build compiles the app in Expo's cloud — no Android Studio or SDK needed
on this machine. I can't run the login/build myself (needs your interactive
browser auth and a paid-or-free Expo account), but everything is configured
— `eas.json`, `app.json`'s Android package name, and the SMS permission
module are all already in place.

**Do this after the backend is deployed** (see `backend/DEPLOY_FLY.md`) —
the backend URL gets baked into the app at build time. Building against the
LAN IP would produce an APK that only works on this laptop's network.

## 1. Sign in

```powershell
# eas-cli is already installed in this session (npx eas-cli works too)
eas login
```

Free Expo account, same idea as any other signup — opens a browser.

## 2. Point the build at your deployed backend

Edit the project root `.env`:

```
EXPO_PUBLIC_BACKEND_URL=https://YOUR-APP-NAME.fly.dev
```

## 3. Build

```bash
eas build --platform android --profile preview
```

This queues a cloud build (free tier: a handful of builds/month, no card
needed for this tier as of now). Takes roughly 10–20 minutes. `eas.json`'s
`preview` profile is set to produce a direct-install `.apk` — no Play Store
needed.

Android signing: EAS generates and manages a keystore for you automatically
on first build — nothing to configure.

## 4. Install it

When the build finishes, the terminal prints a URL and a QR code. Either:
- Scan the QR code with your phone's camera → downloads and offers to
  install the APK directly, or
- Open the printed URL on the phone and tap **Download**.

Android will warn about installing from an unknown source (normal for any
APK not from the Play Store) — allow it for this one install.

## 5. Grant SMS permission

First launch → Settings → **Bank SMS detection** → the app will ask for SMS
permission. This only works in this real build, never in Expo Go.

## Rebuilding after changes

Same command:

```bash
eas build --platform android --profile preview
```

Each build produces a new APK — reinstall over the old one (same package
name, so it upgrades in place rather than needing an uninstall).

## Later: Play Store

The `production` profile in `eas.json` builds an `.aab` (Play Store's
required format) instead of a direct `.apk`. That's a separate, bigger step
— a Google Play Developer account (one-time $25), store listing, privacy
policy, and Google's review — worth doing once the app is genuinely ready
for other people, not before.
