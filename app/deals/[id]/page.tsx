import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeal } from "@/lib/store";
import { ASSET_LABEL, type FinanceStructure } from "@/lib/types";
import { money, moneyShort, pct } from "@/lib/format";
import { OfferPanel } from "@/components/offer-panel";

const STRUCT_LABEL: Record<FinanceStructure, string> = {
  seller_carry: "Seller carry",
  subject_to: "Subject-to",
  assumable: "Assumable",
  master_lease: "Master lease",
  conventional: "Conventional",
  cash: "Cash",
};

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDeal(id);
  if (!d) notFound();
  const a = d.analysis;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <Link href="/" className="text-sm text-ink-soft hover:text-canyon">← Pipeline</Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{d.name}</h1>
          <p className="text-sm text-ink-soft mt-1">
            {[d.address, d.city, d.state].filter(Boolean).join(", ")} · {ASSET_LABEL[d.assetType]}
            {d.driveHours != null ? ` · ${d.driveHours}h from St George` : ""}
          </p>
          {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-canyon hover:underline">View listing ↗</a>}
        </div>
        <div className="flex gap-2">
          {[
            ["Ask", moneyShort(d.price)],
            ["Offer", moneyShort(a?.offerPrice)],
            ["Fit", d.fitScore != null ? `${d.fitScore}/10` : "—"],
          ].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-line bg-white px-4 py-2 text-center">
              <div className="text-lg font-bold tabular-nums">{v}</div>
              <div className="text-[10px] uppercase tracking-wide text-ink-soft">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {d.notes && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">⚠ {d.notes}</div>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* analysis */}
        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft mb-3">Analysis {a?.model && <span className="font-normal normal-case text-ink-soft/70">· {a.model}</span>}</h2>
            {a ? (
              <>
                {a.summary && <p className="text-sm mb-4">{a.summary}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    ["In-place NOI", money(a.noi)],
                    ["Cap rate", pct(a.capRate)],
                    ["CapEx", money(a.capex)],
                    ["Stabilized NOI", money(a.stabilizedNoi)],
                    ["Offer price", money(a.offerPrice)],
                    ["Yield on cost", pct(a.offerYieldOnCost)],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div className="text-sm font-semibold tabular-nums">{v}</div>
                      <div className="text-[11px] uppercase tracking-wide text-ink-soft">{l}</div>
                    </div>
                  ))}
                </div>
                {a.creativeTerms && (
                  <div className="rounded-lg bg-sand/60 px-3 py-2 text-sm mb-4"><span className="font-semibold">Creative terms: </span>{a.creativeTerms}</div>
                )}
                {a.financing?.length > 0 && (
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-left text-xs uppercase text-ink-soft border-b border-line">
                        <th className="py-2">Structure</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Down</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Balloon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.financing.map((f, i) => (
                        <tr key={i} className="border-b border-line/50 last:border-0">
                          <td className="py-2">{f.label} <span className="text-ink-soft">· {STRUCT_LABEL[f.structure]}</span></td>
                          <td className="py-2 text-right tabular-nums">{moneyShort(f.price)}</td>
                          <td className="py-2 text-right tabular-nums">{(f.downPct * 100).toFixed(0)}%</td>
                          <td className="py-2 text-right tabular-nums">{f.rate ? (f.rate * 100).toFixed(2) + "%" : "—"}</td>
                          <td className="py-2 text-right tabular-nums">{f.balloonYears ? f.balloonYears + "y" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {a.risks && a.risks.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-ink-soft mb-1">Risks</div>
                    <ul className="list-disc pl-5 text-sm text-ink-soft space-y-0.5">{a.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-soft">Not analyzed yet. The analysis engine (M3) will populate NOI, CapEx, financing scenarios, and an offer price.</p>
            )}
          </section>
        </div>

        {/* sidebar: contact + offer */}
        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft mb-3">Contact</h2>
            {d.contact ? (
              <div className="text-sm space-y-1">
                <div className="font-semibold">{d.contact.name}{d.contact.confidence && <span className="ml-2 text-[10px] uppercase rounded bg-sand2 px-1.5 py-0.5 text-ink-soft">{d.contact.confidence}</span>}</div>
                {d.contact.brokerage && <div className="text-ink-soft">{d.contact.brokerage}</div>}
                {d.contact.phone && <div>{d.contact.phone}</div>}
                {d.contact.email && <div className="text-canyon break-all">{d.contact.email}</div>}
                {d.contact.source && <div className="text-xs text-ink-soft">{d.contact.source}</div>}
              </div>
            ) : (
              <p className="text-sm text-ink-soft">Contact enrichment pending.</p>
            )}
          </section>

          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft mb-3">Offer email</h2>
            {d.offer ? (
              <OfferPanel
                dealId={d.id}
                recipient={d.offer.recipient ?? d.contact?.email}
                subject={d.offer.subject}
                emailBody={d.offer.emailBody}
                status={d.offer.status}
                sentAt={d.offer.sentAt}
                hasPdf={Boolean(d.offer.pdfBase64)}
              />
            ) : (
              <p className="text-sm text-ink-soft">Draft generated after analysis.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
