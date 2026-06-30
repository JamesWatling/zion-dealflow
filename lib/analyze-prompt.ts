import type { Analysis, Contact, Property } from "./types";

export interface AnalysisResult {
  analysis: Analysis;
  offer?: { subject: string; emailBody: string; recipient?: string };
  contact?: Contact;
}

const buyer = () => ({
  name: process.env.BUYER_NAME || "Zion Property Acquisitions",
  entity: process.env.BUYER_ENTITY || "Zion Property Acquisitions, LLC",
  email: process.env.BUYER_EMAIL || "info@zionpropertyacquisitions.com",
  phone: process.env.BUYER_PHONE || "(435) 625-1668",
});

export function buildAnalysisPrompt(d: Property): string {
  const b = buyer();
  const facts = JSON.stringify(
    {
      name: d.name, url: d.url, address: d.address, city: d.city, state: d.state,
      assetType: d.assetType, price: d.price, units: d.units, beds: d.beds, sqft: d.sqft,
      yearBuilt: d.yearBuilt, daysOnMarket: d.daysOnMarket, priceCuts: d.priceCuts,
      sellerFinancing: d.sellerFinancing, driveHours: d.driveHours, contact: d.contact, notes: d.notes,
    },
    null,
    2,
  );

  return `You are an acquisitions underwriter for ${b.entity}, a principal buyer of turnkey, semi-passive income property within ~5 hours of St George, UT (RV parks, mobile-home parks, motels, self-storage, small multifamily, by-the-room houses). The strategy is CREATIVE FINANCING — seller carry, subject-to, assumable loans, master lease + option, low/no money down — favoring motivated sellers (long days-on-market, price cuts, advertised seller financing) and TURNKEY condition (not heavy rehab).

Underwrite this listing conservatively and produce an aggressive-but-defensible creative-financing offer plus a short outreach email to the listing agent/seller.

LISTING FACTS:
${facts}

GUIDELINES:
- Be conservative: assume market-rate (not best-case) rents, realistic expense ratios for the asset type, and >=8-12% vacancy where seasonal/summer gaps apply.
- Estimate NOI, cap rate (decimal, e.g. 0.07), any CapEx needed for turnkey, and a stabilized NOI if light value-add applies.
- Propose an OFFER PRICE that hits a strong yield for the buyer (target ~8-10% yield on total cost where the income supports it; for thin-cap/strategic assets, explain). Prefer pricing to in-place income.
- Provide 1-3 financing scenarios. structure must be one of: seller_carry, subject_to, assumable, master_lease, conventional, cash. downPct and rate are decimals (0-1).
- fitScore 1-10 for an aggressive low/no-money-down creative offer (motivation x finance signal x passiveness x value).
- List concrete risks and what to verify in due diligence. Do not invent facts; mark unknowns.
- Write a concise, warm, professional outreach email to the agent/seller (sign as "${b.name} · ${b.phone} · ${b.email}"). If the listing has a contact email, set offer.recipient to it. Use "Hi [Name]," if the agent name is unknown.

Output JSON exactly matching this shape (numbers as numbers, omit unknown numeric fields or use null):
{
  "analysis": {
    "noi": number|null, "capRate": number|null, "capex": number|null, "stabilizedNoi": number|null,
    "offerPrice": number, "offerYieldOnCost": number|null,
    "financing": [{"label": string, "price": number, "downPct": number, "rate": number, "structure": string, "balloonYears": number|null, "monthlyDebtService": number|null, "notes": string|null}],
    "creativeTerms": string, "fitScore": number, "summary": string, "risks": [string]
  },
  "offer": {"subject": string, "emailBody": string, "recipient": string|null},
  "contact": {"name": string|null, "brokerage": string|null, "phone": string|null, "email": string|null, "confidence": "high"|"medium"|"low", "source": string|null} | null
}`;
}
