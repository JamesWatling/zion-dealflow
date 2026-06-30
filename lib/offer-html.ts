import type { FinanceStructure, Property } from "./types";
import { money } from "./format";

const STRUCT: Record<FinanceStructure, string> = {
  seller_carry: "Seller carry",
  subject_to: "Subject-to existing financing",
  assumable: "Loan assumption",
  master_lease: "Master lease + option",
  conventional: "Conventional",
  cash: "Cash",
};

const buyer = () => ({
  name: process.env.BUYER_NAME || "Zion Property Acquisitions",
  entity: process.env.BUYER_ENTITY || "Zion Property Acquisitions, LLC",
  email: process.env.BUYER_EMAIL || "info@zionpropertyacquisitions.com",
  phone: process.env.BUYER_PHONE || "(435) 625-1668",
});

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

// Renders a non-binding LOI / offer one-pager from a deal's analysis. Source for the PDF.
export function buildOfferHtml(d: Property): string {
  const b = buyer();
  const a = d.analysis;
  const f = a?.financing?.[0];
  const where = [d.address, d.city, d.state].filter(Boolean).join(", ");
  const terms = f
    ? `<table>
        <tr><th>Purchase price</th><td>${money(f.price)}</td></tr>
        <tr><th>Structure</th><td>${STRUCT[f.structure]}</td></tr>
        <tr><th>Down payment</th><td>${(f.downPct * 100).toFixed(0)}% (${money(Math.round(f.price * f.downPct))})</td></tr>
        ${f.rate ? `<tr><th>Interest rate</th><td>${(f.rate * 100).toFixed(2)}% fixed</td></tr>` : ""}
        ${f.balloonYears ? `<tr><th>Term</th><td>${f.balloonYears}-year balloon, no prepayment penalty</td></tr>` : ""}
        ${f.notes ? `<tr><th>Notes</th><td>${esc(f.notes)}</td></tr>` : ""}
      </table>`
    : `<p>${a?.creativeTerms ? esc(a.creativeTerms) : "Terms to be proposed."}</p>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: Letter; margin: 16mm 15mm; }
    *{box-sizing:border-box} body{font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;color:#241f1c;font-size:11px;line-height:1.55;margin:0}
    .hd{border-left:5px solid #9c3b1b;padding:2px 0 2px 12px;margin-bottom:14px}
    h1{font-size:20px;margin:0;color:#14304a} .sub{color:#5c5149;font-size:11px}
    h2{font-size:13px;color:#14304a;border-bottom:2px solid #c9892f;padding-bottom:3px;margin:16px 0 7px}
    table{width:100%;border-collapse:collapse;margin:6px 0;font-size:10.5px}
    th,td{text-align:left;padding:5px 8px;border-bottom:1px solid #e7dccd;vertical-align:top}
    th{width:34%;color:#14304a;background:#f6f2ec}
    .box{background:#f6f9fc;border-left:4px solid #c9892f;padding:9px 12px;border-radius:4px;margin:9px 0}
    .small{font-size:8.5px;color:#6b7b8b} ul{margin:5px 0;padding-left:18px} li{margin:2px 0}
    .sig td{border:none;padding-top:20px} .meta td{border:none;padding:1px 8px 1px 0;font-size:10.5px}
  </style></head><body>
    <div class="hd"><h1>Letter of Intent <span class="sub">(Non-Binding)</span></h1>
      <div class="sub">${esc(d.name)}${where ? " — " + esc(where) : ""}</div></div>
    <table class="meta">
      <tr><td><strong>From:</strong></td><td>${esc(b.entity)} and/or assigns ("Buyer")</td></tr>
      ${d.contact?.name ? `<tr><td><strong>To:</strong></td><td>${esc(d.contact.name)}${d.contact.brokerage ? ", " + esc(d.contact.brokerage) : ""}</td></tr>` : ""}
      ${d.url ? `<tr><td><strong>Re:</strong></td><td>${esc(d.url)}</td></tr>` : ""}
    </table>
    <p>Buyer submits this non-binding Letter of Intent to acquire the above property. This LOI is a basis for negotiating a definitive Purchase &amp; Sale Agreement and is non-binding except for the Exclusivity and Confidentiality sections.</p>
    <h2>1. Offer &amp; Terms</h2>
    ${terms}
    ${a?.summary ? `<div class="box">${esc(a.summary)}</div>` : ""}
    <h2>2. Due Diligence</h2>
    <p>45 days from execution, at Buyer's cost, including financials/rent roll, inspection, title, and${d.assetType === "motel" || d.assetType === "rv_park" ? " environmental/UST review where applicable," : ""} any items below. Buyer may terminate or renegotiate with refund of earnest if findings are unsatisfactory.</p>
    ${a?.risks?.length ? `<ul>${a.risks.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
    <h2>3. Closing &amp; Exclusivity</h2>
    <p>Close 30 days after due-diligence removal via a mutually agreed title company; clear title; standard prorations. Upon acceptance, Seller negotiates exclusively with Buyer for 30 days. Terms kept confidential.</p>
    <table class="sig"><tr><td style="width:50%">Buyer: ____________________ Date: ______</td><td>Seller: ____________________ Date: ______</td></tr></table>
    <p class="small">${esc(b.name)} · ${esc(b.phone)} · ${esc(b.email)}. Preliminary, non-binding analysis; figures are estimates pending the seller's books. Not legal/tax/investment advice. Buyer is a principal, not a brokerage.</p>
  </body></html>`;
}
