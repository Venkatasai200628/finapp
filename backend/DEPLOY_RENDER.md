# Deploying fin-backend to Render (no card required)

Gives the backend a permanent public HTTPS URL, reachable from anywhere - no
more laptop-dependent LAN IPs. Chosen over Fly.io specifically because
Render's free web-service tier doesn't ask for a payment method.

**Honest tradeoff**: the free tier has no persistent disk. The SQLite file
resets whenever the service redeploys or Render recycles the instance (which
can happen after periods of inactivity). Real SMS-based detection, auth, and
the live HTTPS URL all work - but transaction history and learned baselines
aren't guaranteed to survive indefinitely the way they would on a paid disk
or on Fly. Fine for getting things genuinely working and testable now; if
the resets become a real problem later, the fix is a free external database
(e.g. Turso, SQLite-compatible, no card) rather than more Render config.

Free tier also **spins down after ~15 minutes of no traffic** and takes
30-60 seconds to wake up on the next request - the first request after idle
will feel slow, that's normal.

I can't create the Render account or connect your GitHub repo myself - both
need your interactive browser login. Everything else (`render.yaml`) is
already prepared.

## 1. Sign up

Go to https://render.com and sign up (GitHub login is easiest, since your
code already lives there). No card required for the free tier.

## 2. Connect your repo and deploy the blueprint

1. In the Render dashboard, click **New +** -> **Blueprint**.
2. Connect your GitHub account if prompted, then pick the `finapp` repo
   (grant Render access to it if asked).
3. Render will detect `backend/render.yaml` and show you the `fin-backend`
   service it's about to create. Click **Apply**.

If Render doesn't auto-detect the blueprint path (it looks for
`render.yaml` at the repo root by default, but ours is in `backend/`), use
**New +** -> **Web Service** instead and configure manually:
- Root directory: `backend`
- Runtime: Node
- Build command: `npm ci && npm run build`
- Start command: `node dist/index.js`
- Plan: Free
- Health check path: `/api/health`

## 3. Set the JWT secret

In the new service's **Environment** tab, add:

```
JWT_SECRET = 8cf9a71cd7c3e027061c1d4b97489916b8f4bc51b666bab4cc1ee6cc574f7299
```

(Same value from the Fly guide - fine to reuse, or generate your own with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.)
Save - Render redeploys automatically when you change an env var.

## 4. Verify

Once the deploy finishes (watch the **Logs** tab for
`fin-backend listening on http://localhost:4000`), Render shows the public
URL at the top of the service page, e.g. `https://fin-backend-xxxx.onrender.com`.

```bash
curl https://fin-backend-xxxx.onrender.com/api/health
# expect: {"ok":true,"dataSource":"simulator"}
```

(First request after a cold start can take up to a minute - that's the free
tier waking up, not a failure.)

## 5. Point the app at it

Back in the project root, edit `.env`:

```
EXPO_PUBLIC_BACKEND_URL=https://fin-backend-xxxx.onrender.com
```

This is also the exact value to bake into the APK build - see
`../EAS_BUILD.md`.

## Updating later

Render auto-deploys on every push to `main` by default - no manual step
needed. To redeploy without a code change, use the **Manual Deploy** button
on the service page.

## Logs / debugging

The **Logs** tab on the service page streams stdout/stderr in real time.
