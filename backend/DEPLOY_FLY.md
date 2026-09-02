# Deploying fin-backend to Fly.io

Gives the backend a permanent public HTTPS URL, reachable from anywhere —
no more laptop-dependent LAN IPs, no campus-network tunnel blocking. The
database lives on a persistent volume, so it survives redeploys and the
machine sleeping when idle.

**Fly requires a card on file** even for free-tier usage (it's used only if
you exceed the free allowance — normal usage for an app like this stays
within it, and `fly.toml` here is already configured to auto-stop the
machine when idle to help with that).

I can't run the commands below myself — `flyctl launch` needs an interactive
browser login and asks you questions along the way. Everything else (the
Dockerfile, fly.toml, and this checklist) is already prepared.

## 1. Install & sign in

```powershell
# Already installed in this session at C:\Users\venka\.fly\bin\flyctl.exe
# Add it to PATH permanently, or use the full path each time.
flyctl auth login
```

This opens a browser to sign up/log in — free, no different from any other
account signup.

## 2. Launch the app

```bash
cd backend
flyctl launch --no-deploy
```

It'll detect the `Dockerfile` and `fly.toml` already here and ask a few
questions:
- **App name**: `fin-backend` is likely taken globally (Fly names are
  global) — pick something unique, e.g. `fin-backend-praveen17`.
- **Region**: keep `bom` (Mumbai) unless you're elsewhere.
- **Postgres / Redis**: say **no** to both — this app only needs the volume
  already declared in `fly.toml`.
- **Deploy now**: say **no** — set the secret first (next step), or your
  first deploy runs without one.

## 3. Set the JWT secret

Never commit this — it goes straight to Fly's secret store, not a file:

```bash
flyctl secrets set JWT_SECRET=8cf9a71cd7c3e027061c1d4b97489916b8f4bc51b666bab4cc1ee6cc574f7299
```

(That value was generated fresh for you — fine to use, but generate your own
with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
if you'd rather.)

## 4. Deploy

```bash
flyctl deploy
```

This builds the Docker image (on Fly's remote builder — your machine doesn't
need Docker running locally) and ships it.

## 5. Verify

```bash
flyctl status
# note the hostname it prints, e.g. fin-backend-praveen17.fly.dev

curl https://YOUR-APP-NAME.fly.dev/api/health
# expect: {"ok":true,"dataSource":"simulator"}
```

## 6. Point the app at it

Back in the project root, edit `.env`:

```
EXPO_PUBLIC_BACKEND_URL=https://YOUR-APP-NAME.fly.dev
```

This is also the exact value to bake into the APK build — see
`../EAS_BUILD.md`.

## Updating later

```bash
cd backend
flyctl deploy
```

That's the whole update flow — no SSH, no manual file copying.

## Logs / debugging

```bash
flyctl logs
```
