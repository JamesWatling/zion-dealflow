# Zion Dealflow — Deal Engine

An end-to-end acquisitions pipeline: **source → screen → analyze → draft offer → approve → send**, with a human-in-the-loop outbox. Built for Zion Property Acquisitions' buy box (≤5hr of St George; RV parks, MH parks, motels, self-storage, small multifamily, by-room houses; turnkey; creative financing).

## Stack
- **Next.js 16 (App Router) on Vercel** — dashboard + API routes
- **Neon Postgres** (Vercel Marketplace) + **Drizzle ORM** — datastore
- **Claude API** (`claude-opus-4-8` / `claude-sonnet` for cheaper passes) — analysis + drafting engine
- **Resend** — sending (domain already verified)
- **Cloudflare Email Worker** — alert-email ingestion → `/api/ingest`
- **Vercel Cron** — scheduled search-agent sourcing + re-screen
- **HTML→PDF** — offer PDFs (reuse the templates from the research repo)

## Three intake channels → one queue
1. **Alert emails** — saved searches on Crexi/LoopNet/Zillow/BizBuySell/rvparkstore forward to `deals@zionpropertyacquisitions.com` → Cloudflare Worker parses → `POST /api/ingest`. Clean, structured, legal.
2. **Search agents** — Vercel Cron fires Claude web-search agents (e.g. "RV park for sale southern Utah price reduced") → queue new hits. Broad discovery; partial data → needs enrichment.
3. **Paste a URL** — manual intake; enrichment pass fills the rest.

## Pipeline stages
`sourced → screening → analyzed → drafted → outbox → sent → replied` (+ `archived`)

- **Screen:** rules engine scores vs. buy box (geography, asset type, turnkey, DOM, price cuts, seller-finance signals); auto-archives misses.
- **Analyze:** Claude → structured underwriting (NOI, CapEx, cap rate, financing scenarios, creative terms, offer price, fit score, risks).
- **Find contact:** enrichment agent → named agent + phone/email + confidence.
- **Generate:** offer PDF + tailored agent/seller email draft.
- **Outbox:** you review/edit/approve each offer; on **Approve & Send**, Resend delivers the email (PDF attached) from your domain; status tracked.

## Data model (see `lib/types.ts` / `lib/db/schema.ts`)
`properties` ─1:1→ `analyses`, `contacts`, `offers`; plus an `events` log.

## Milestones
- **M1 (this commit):** scaffold + data model + dashboard + deal/outbox UI (mock-seeded). ✅
- **M2:** Neon + Drizzle; real persistence; `/api/ingest` webhook + Cloudflare alert worker; paste-a-URL.
- **M3:** Claude analysis engine (structured output) + contact enrichment.
- **M4:** PDF + email-draft generation (port the research-repo templates server-side).
- **M5:** Outbox approve/edit/send via Resend; status + events; reply tracking.
- **M6:** Vercel Cron search-agents + screening rules + dedupe.
- **M7:** Auth (lock to you), follow-up sequences, analytics.

## Provisioning needed (env vars)
`DATABASE_URL` (Neon) · `ANTHROPIC_API_KEY` · `RESEND_API_KEY` · `INGEST_SECRET` (Cloudflare→app shared secret) · `APP_PASSWORD` (simple auth).

## Compliance notes
Principal buyer (not a brokerage). Keep CAN-SPAM hygiene on outbound email, respect DNC for calls, warm up sending volume to protect domain reputation. Human approval is the quality gate on every offer.
