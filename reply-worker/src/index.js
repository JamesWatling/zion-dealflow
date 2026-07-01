/**
 * Zion Dealflow — reply-detection Worker (Cloudflare Email Worker).
 * Bind as the CATCH-ALL destination in Cloudflare Email Routing (keep info@ on its
 * own rule → your inbox so it takes precedence). Offers are sent with reply-to
 * reply+<dealId>@zionpropertyacquisitions.com; when a seller replies, this worker
 * attributes it to the deal (POST /api/reply) and forwards the email to your inbox.
 *
 * Env (wrangler.toml vars + secrets):
 *   REPLY_URL     = https://<your-app>/api/reply
 *   INGEST_SECRET = shared secret (wrangler secret put INGEST_SECRET)
 *   FORWARD_TO    = your real inbox (must be a verified Cloudflare destination)
 */
export default {
  async email(message, env) {
    const to = message.to || "";
    const m = to.match(/reply\+([a-z0-9-]+)@/i);
    if (m && env.REPLY_URL && env.INGEST_SECRET) {
      try {
        await fetch(env.REPLY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-ingest-secret": env.INGEST_SECRET },
          body: JSON.stringify({ dealId: m[1] }),
        });
      } catch (e) {
        console.log("reply post failed", e);
      }
    }
    // Always forward to the human inbox so replies are still read.
    if (env.FORWARD_TO) {
      try {
        await message.forward(env.FORWARD_TO);
      } catch (e) {
        console.log("forward failed", e);
      }
    }
  },
};
