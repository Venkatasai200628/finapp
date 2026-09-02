# Running fin-backend on the same VPS as the trading bot

Colocating with the bot means `TRADING_BOT_DB_PATH` is just a local file path
— no bridge script, no scp, no LAN/tunnel issues. It also gives the app a
permanent public URL, which fixes the campus-network problem separately:
Metro/the app currently depend on this laptop being reachable; a VPS with a
public IP is reachable from anywhere, always, regardless of what network your
phone is on.

Run everything below **on the VPS**, over the SSH session you already use to
manage the bot.

## 1. Get the code onto the VPS

```bash
git clone https://github.com/Venkatasai200628/finapp.git fin-app
cd fin-app/backend
npm install
```

## 2. Configure it

```bash
cp .env.example .env
```

Generate a real secret — the backend refuses to run predictably without one
(a missing `JWT_SECRET` gets a random one every restart, signing everyone
out each time):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit `.env` and set:

```bash
PORT=4000
JWT_SECRET=<paste the value the command above printed>

# Point this at the bot's real database. Confirm the exact path first:
#   find / -name trades.db 2>/dev/null
TRADING_BOT_DB_PATH=/home/bot24-7/crypto_trading_bot/logs/trades.db
```

## 3. Open the port

Whatever firewall your VPS provider uses, allow inbound TCP on 4000. Most
commonly:

```bash
sudo ufw allow 4000/tcp
```

(If your provider is a cloud host like DigitalOcean/AWS/etc., there's likely
also a security-group/firewall rule to add in their dashboard — ufw alone
won't be enough there.)

## 4. Run it so it survives your SSH session ending

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name fin-backend
pm2 save
pm2 startup    # follow the one printed command to survive a VPS reboot too
```

Check it's actually up:

```bash
curl http://localhost:4000/api/health
```

## 5. Point the app at it

Back on your laptop, edit the project's root `.env` (not `backend/.env`):

```bash
EXPO_PUBLIC_BACKEND_URL=http://YOUR_VPS_PUBLIC_IP:4000
```

Restart Expo (`npm run web` or `npx expo start`) so it picks up the new value
— it's only read at startup.

## Verifying it worked

```bash
curl http://YOUR_VPS_PUBLIC_IP:4000/api/health
curl http://YOUR_VPS_PUBLIC_IP:4000/api/trading/status
# ^ expect 401 here — that's correct, it means auth is working;
#   the app itself will pass a real token once you're signed in
```

Sign in fresh in the app — this is a new database on the VPS, separate from
whatever local account you made testing on this laptop — then open the
Trading tab. It should show your bot's real win rate, real open positions,
and real behaviour flags instead of "Bot not connected".

## Updating later

```bash
cd ~/fin-app && git pull
cd backend && npm install && npm run build
pm2 restart fin-backend
```
