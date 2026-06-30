import Link from "next/link";
import { getDeals } from "@/lib/store";
import { ASSET_LABEL, STAGE_ORDER, type DealStage } from "@/lib/types";
import { moneyShort } from "@/lib/format";

const STAGE_STYLE: Record<DealStage, string> = {
  sourced: "bg-sand2 text-ink-soft",
  screening: "bg-sand2 text-ink-soft",
  analyzed: "bg-amber-100 text-amber-800",
  drafted: "bg-blue-100 text-blue-800",
  outbox: "bg-canyon text-white",
  sent: "bg-emerald-100 text-emerald-800",
  replied: "bg-emerald-600 text-white",
  archived: "bg-zinc-200 text-zinc-500",
};

function StageBadge({ stage }: { stage: DealStage }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STAGE_STYLE[stage]}`}>
      {stage === "outbox" ? "Outbox · approve" : stage}
    </span>
  );
}

function Fit({ score }: { score?: number }) {
  if (score == null) return <span className="text-ink-soft">—</span>;
  const c = score >= 8 ? "text-emerald-700" : score >= 6 ? "text-amber-700" : "text-ink-soft";
  return <span className={`font-bold tabular-nums ${c}`}>{score}</span>;
}

export default async function Dashboard() {
  const deals = await getDeals();
  const outbox = deals.filter((d) => d.stage === "outbox");
  const counts = Object.fromEntries(STAGE_ORDER.map((s) => [s, deals.filter((d) => d.stage === s).length]));

  const stats = [
    { label: "In pipeline", value: deals.filter((d) => d.stage !== "archived").length },
    { label: "Awaiting approval", value: counts.outbox ?? 0, hot: true },
    { label: "Analyzed", value: counts.analyzed ?? 0 },
    { label: "Sent", value: counts.sent ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-ink-soft mt-1">Source → analyze → draft → approve → send.</p>
        </div>
        <button className="rounded-lg bg-canyon px-4 py-2 text-sm font-semibold text-white hover:bg-canyon-dark transition">
          + Add property
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.hot && s.value > 0 ? "border-canyon bg-canyon/5" : "border-line bg-white"}`}>
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="text-xs uppercase tracking-wide text-ink-soft mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* outbox */}
      {outbox.length > 0 && (
        <section className="mb-9">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-canyon mb-3">Outbox — awaiting your approval</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {outbox.map((d) => (
              <Link key={d.id} href={`/deals/${d.id}`} className="block rounded-xl border border-canyon/40 bg-white p-4 hover:shadow-md hover:-translate-y-px transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{d.name}</div>
                  <Fit score={d.fitScore} />
                </div>
                <div className="text-xs text-ink-soft mt-0.5">{[d.city, d.state].filter(Boolean).join(", ")} · {ASSET_LABEL[d.assetType]}</div>
                <div className="mt-3 text-sm">
                  <span className="text-ink-soft">Offer </span>
                  <span className="font-semibold">{moneyShort(d.analysis?.offerPrice)}</span>
                  <span className="text-ink-soft"> vs ask {moneyShort(d.price)}</span>
                </div>
                <div className="mt-2 text-xs text-ink-soft truncate">✉ {d.offer?.subject}</div>
                <div className="mt-3 inline-flex rounded-md bg-canyon px-3 py-1.5 text-xs font-semibold text-white">Review &amp; approve →</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* pipeline table */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft mb-3">All deals</h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-soft border-b border-line">
                <th className="px-4 py-3 font-semibold">Property</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold text-right">Ask</th>
                <th className="px-4 py-3 font-semibold text-right">Offer</th>
                <th className="px-4 py-3 font-semibold text-right">DOM</th>
                <th className="px-4 py-3 font-semibold text-center">Fit</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-b border-line/60 last:border-0 hover:bg-sand/40">
                  <td className="px-4 py-3">
                    <Link href={`/deals/${d.id}`} className="font-medium hover:text-canyon">{d.name}</Link>
                    <div className="text-xs text-ink-soft">{[d.city, d.state].filter(Boolean).join(", ")}{d.driveHours != null ? ` · ${d.driveHours}h` : ""}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{ASSET_LABEL[d.assetType]}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{moneyShort(d.price)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{moneyShort(d.analysis?.offerPrice)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{d.daysOnMarket ?? "—"}</td>
                  <td className="px-4 py-3 text-center"><Fit score={d.fitScore} /></td>
                  <td className="px-4 py-3"><StageBadge stage={d.stage} /></td>
                  <td className="px-4 py-3 text-ink-soft text-xs">{d.contact?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-soft mt-3">Seeded with real deals from the acquisitions research. Live data lands in M2 (Neon).</p>
      </section>
    </div>
  );
}
