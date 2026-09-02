# Deploying fin-backend to Koyeb (no card required)

Gives the backend a permanent public HTTPS URL. Chosen over Render because
Render's create-service flow was pushing towards a paid ($7/mo) instance
type; Koyeb's free web-service tier is explicitly no-card-required.

**Same honest tradeoff as Render**: Koyeb's free tier has no persistent
disk, so the SQLite file resets whenever the service redeploys or the
instance is recycled. Real SMS-based detection, auth, and the live HTTPS
URL all work - transaction history and learned baselines just aren't
guaranteed to survive indefinitely. If that becomes a real problem later,
the fix is a free external database (e.g. Turso, SQLite-compatible, no
card), not more hosting config.

Free tier also **sleeps after a period of no traffic** and takes a short
moment to wake on the next request - normal, not a failure.

I can't create the Koyeb account or connect your GitHub repo myself - both
need your interactive browser login.

## 1. Sign up

Go to https://www.koyeb.com and sign up (GitHub login is easiest). No card
required for the free tier.

## 2. Create the service

1. In the Koyeb dashboard, click **Create Web Service**.
2. Choose **GitHub** as the source, connect your account if prompted, and
   pick the `finapp` repo.
3. Configure:
   - **Branch**: `main`
   - **Root directory / Work directory**: `backend`
   - **Builder**: Dockerfile (Koyeb will auto-detect `backend/Dockerfile`,
     already prepared for the Fly deploy - it works here unchanged)
   - **Instance type**: **Free** (Koyeb calls it "Eco" / "Free" depending on
     current naming - pick the $0 option)
   - **Port**: `4000` (matches `EXPOSE 4000` in the Dockerfile)
4. Add an environment variable:
   ```
   JWT_SECRET = 8cf9a71cd7c3e027061c1d4b97489916b8f4bc51b666bab4cc1ee6cc574f7299
   ```
   (Same value used in the other guides - fine to reuse, or generate your
   own with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.)
5. Click **Deploy**.

## 3. Verify

Koyeb shows a public URL once deployed, e.g.
`https://fin-backend-yourname.koyeb.app`.

```bash
curl https://fin-backend-yourname.koyeb.app/api/health
# expect: {"ok":true,"dataSource":"simulator"}
```

(First request after idle can be slow while the instance wakes up.)

## 4. Point the app at it

Back in the project root, edit `.env`:

```
EXPO_PUBLIC_BACKEND_URL=https://fin-backend-yourname.koyeb.app
```

This is also the exact value to bake into the APK build - see
`../EAS_BUILD.md`.

## Updating later

Koyeb auto-redeploys on every push to `main` by default. No manual step
needed.

## Logs / debugging

The service page's **Logs** tab streams stdout/stderr in real time.
