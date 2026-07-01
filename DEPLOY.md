# Deploying Zion Dealflow

The dashboard runs on **Vercel**; the AI workers (`source`/`analyze`/`pdf`/`followup`) run on **your machine** via `claude -p`; ingestion/reply run on **Cloudflare**.

## 1. Provision storage (Vercel dashboard → Marketplace)
On the Vercel project → **Storage**:
- **Neon Postgres** → auto-injects `DATABASE_URL`
- **Blob** → auto-injects `BLOB_READ_WRITE_TOKEN`

Then locally, point `.env` at the Neon URL and create tables + seed:
```bash
npm run db:push
npm run db:seed
```

## 2. Environment variables (Vercel → Settings → Environment Variables)
| Var | Value |
|---|---|
| `DATABASE_URL` | (auto from Neon) |
| `BLOB_READ_WRITE_TOKEN` | (auto from Blob) |
| `APP_PASSWORD` | **pick a strong password** (this logs you into the dashboard) |
| `RESEND_API_KEY` | your Resend key (already have it) |
| `INGEST_SECRET` | (already set on Vercel — `vercel env pull` to retrieve; the Cloudflare workers need the same value) |
| `CRON_SECRET` | (already set on Vercel) |
| `RESEND_WEBHOOK_SECRET` | from Resend → Webhooks (whsec_…) |
| `BUYER_NAME` | Zion Property Acquisitions |
| `BUYER_ENTITY` | Zion Property Acquisitions, LLC |
| `BUYER_EMAIL` | info@zionpropertyacquisitions.com |
| `BUYER_PHONE` | (435) 625-1668 |

> Production **fails closed** without `APP_PASSWORD` and `CRON_SECRET` — set them or the app returns 503.

## 3. Deploy
Easiest: **connect the GitHub repo** (Vercel → Add New → Project → import `JamesWatling/zion-dealflow`) so every push auto-deploys. Or from the CLI: `vercel --prod`.

The daily **Vercel Cron** (`/api/cron/screen`) is already declared in `vercel.json`.

## 4. Cloudflare workers (ingestion + reply tracking)
```bash
# alert ingestion
cd ingest-worker && (edit wrangler.toml: INGEST_URL = https://<app>/api/ingest)
npx wrangler deploy && npx wrangler secret put INGEST_SECRET   # paste the value above

# reply tracking
cd ../reply-worker && (edit wrangler.toml: REPLY_URL = https://<app>/api/reply, FORWARD_TO)
npx wrangler deploy && npx wrangler secret put INGEST_SECRET
```
Cloudflare → Email Routing: route `deals@` → ingest worker; set the **catch-all** → reply worker; keep `info@` → your inbox.

## 5. Resend webhook (delivery/bounce)
Resend → Webhooks → add `https://<app>/api/webhooks/resend`, copy the signing secret into `RESEND_WEBHOOK_SECRET`.

## 6. Daily driver (your machine, Claude Code logged in)
```
0 8 * * *  cd /path/to/zion-dealflow && npm run source && npm run analyze && npm run pdf && npm run followup
```
Then review the **Outbox** and Approve & Send.
