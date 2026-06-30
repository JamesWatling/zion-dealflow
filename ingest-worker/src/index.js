/**
 * Zion Dealflow — alert-email ingest Worker (Cloudflare Email Worker).
 * Bound as a destination in Cloudflare Email Routing for deals@zionpropertyacquisitions.com.
 * Parses listing-alert emails (Crexi/LoopNet/Zillow/BizBuySell/etc.) and POSTs a
 * candidate to the app's /api/ingest. Deeper parsing happens in the analysis step.
 *
 * Env (wrangler.toml vars + secrets):
 *   INGEST_URL    = https://<your-app>/api/ingest
 *   INGEST_SECRET = shared secret (wrangler secret put INGEST_SECRET)
 */
export default {
  async email(message, env) {
    const raw = await new Response(message.raw).text();
    const subject = (message.headers.get("subject") || "Listing alert").replace(/^\s*(re|fwd):\s*/i, "");

    const urlMatch = raw.match(
      /https?:\/\/[^\s"'<>]*(crexi|loopnet|zillow|redfin|bizbuysell|rvparkstore|mobilehomeparkstore|realtor|showcase|parkbrokerage)[^\s"'<>]*/i,
    );
    const priceMatch = raw.match(/\$\s?([0-9](?:[0-9,]{4,}))/);

    const payload = {
      source: "alert",
      name: subject.slice(0, 160),
      url: urlMatch ? decodeHtml(urlMatch[0]) : undefined,
      price: priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : undefined,
      notes: `Alert email from ${message.from}`,
    };

    const res = await fetch(env.INGEST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ingest-secret": env.INGEST_SECRET },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.log("ingest failed", res.status, await res.text());
  },
};

function decodeHtml(s) {
  return s.replace(/&amp;/g, "&").replace(/&#43;/g, "+").replace(/&#61;/g, "=");
}
