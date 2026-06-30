# Zion Dealflow — Setup & Run (any machine)

A Next.js dashboard (deploys to Vercel) + local worker scripts that do the AI heavy-lifting via the **Claude Code CLI** (`claude -p`) so it runs on your Claude subscription — no API key/billing.

## 0. Prerequisites
- **Node 20+** (Node 24 recommended — scripts use `--env-file`).
- **Claude Code CLI** installed and logged in, for the analysis/sourcing workers: run `claude` once and sign in. (Verify: `claude -p "say hi"`.)
- **Vercel account** (to host the dashboard) and **Cloudflare** (DNS + alert worker) — optional until you want it live.
- A **Neon Postgres** database (free) for persistence — optional; without `DATABASE_URL` the app runs on an in-memory seed.

## 1. Install
```bash
git clone https://github.com/JamesWatling/zion-dealflow
cd zion-dealflow
npm install
cp .env.example .env   # fill in what you have; everything is optional to start
```

## 2. Run the dashboard locally
```bash
npm run dev      # http://localhost:3000
```
With no `.env`, it shows the seeded sample deals. Add `DATABASE_URL` to use a real DB.

## 3. Database (Neon)
1. Create a Neon project, copy the pooled connection string into `DATABASE_URL` in `.env`.
2. Create the tables and seed:
```bash
npm run db:push     # creates tables from lib/db/schema.ts
npm run db:seed     # loads the sample deals
```

## 4. Deploy the dashboard (Vercel)
- Import the repo at vercel.com/new (framework auto-detected).
- Add env vars in the Vercel project: `DATABASE_URL`, `INGEST_SECRET`, `RESEND_API_KEY`, `BUYER_*`.
- Deploy. (The analysis/sourcing workers do NOT run on Vercel — they run on your machine, see §6.)

## 5. Alert-email ingestion (Cloudflare)
Bring listings in automatically from saved-search alert emails:
1. Set up saved searches on Crexi/LoopNet/Zillow/BizBuySell/rvparkstore and point their alerts to `deals@zionpropertyacquisitions.com` (or forward them there).
2. Deploy the worker:
```bash
cd ingest-worker
# edit wrangler.toml: set INGEST_URL to https://<your-app>/api/ingest
npx wrangler deploy
npx wrangler secret put INGEST_SECRET   # same value as the app's INGEST_SECRET
```
3. Cloudflare → Email → Email Routing → route `deals@` to this Worker ("Send to a Worker").

New alerts now appear in the **Sourced** column automatically.

## 6. The AI workers (run on your machine — uses Claude Code, not the API)
These connect to the same `DATABASE_URL` and use `claude -p`:
```bash
npm run source     # M6: run search agents -> queue new candidates  (Sourced)
npm run analyze    # M3: underwrite un-analyzed deals + draft offers (Analyzed/Drafted)
```
Run them on demand, or on a cron on your machine (e.g. `crontab`). They need Claude Code installed + logged in. Set `CLAUDE_BIN` if `claude` isn't on PATH.

## 7. Sending offers
From the dashboard **Outbox**, review/edit an offer and click **Approve & Send** — it sends from your domain via Resend with the PDF attached (`RESEND_API_KEY` required; domain already verified).

---
See `SPEC.md` for the architecture and milestone map.
