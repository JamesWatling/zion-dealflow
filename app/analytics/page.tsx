import { getDeals } from "@/lib/store";
import { ASSET_LABEL, STAGE_ORDER, type AssetType, type DealStage } from "@/lib/types";
import { moneyShort } from "@/lib/format";

export default async function Analytics() {
  const deals = await getDeals();
  const live = deals.filter((d) => d.stage !== "archived");
  const count = (s: DealStage) => deals.filter((d) => d.stage === s).length;

  const sent = deals.filter((d) => d.stage === "sent" || d.stage === "replied").length;
  const replied = deals.filter((d) => d.stage === "replied").length;
  const analyzed = deals.filter((d) => d.analysis);
  const avgFit = analyzed.length
    ? (analyzed.reduce((s, d) => s + (d.fitScore ?? 0), 0) / analyzed.length).toFixed(1)
    : "—";
  const askValue = live.reduce((s, d) => s + (d.price ?? 0), 0);
  const offerValue = live.reduce((s, d) => s + (d.analysis?.offerPrice ?? 0), 0);

  const byAsset = Object.entries(
    deals.reduce<Record<string, number>>((acc, d) => {
      acc[d.assetType] = (acc[d.assetType] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const funnelMax = Math.max(1, ...STAGE_ORDER.map(count));

  const kpis = [
    { label: "Live pipeline", value: live.length },
    { label: "Offers sent", value: sent },
    { label: "Replies", value: `${replied}${sent ? ` (${Math.round((replied / sent) * 100)}%)` : ""}` },
    { label: "Avg fit", value: avgFit },
    { label: "Pipeline ask", value: moneyShort(askValue) },
    { label: "Offer value", value: moneyShort(offerValue) },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Analytics</h1>
      <p className="text-sm text-ink-soft mb-6">Pipeline health across all deals.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-9">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-line bg-white p-4">
            <div className="text-xl font-bold tabular-nums">{k.value}</div>
            <div className="text-[11px] uppercase tracking-wide text-ink-soft mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft mb-4">Funnel</h2>
          <div className="space-y-2">
            {STAGE_ORDER.map((s) => {
              const n = count(s);
              return (
                <div key={s} className="flex items-center gap-3 text-sm">
                  <div className="w-20 shrink-0 capitalize text-ink-soft">{s}</div>
                  <div className="flex-1 bg-sand rounded h-5 overflow-hidden">
                    <div className="h-full bg-canyon rounded" style={{ width: `${(n / funnelMax) * 100}%` }} />
                  </div>
                  <div className="w-6 text-right tabular-nums">{n}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft mb-4">By asset type</h2>
          <div className="space-y-2">
            {byAsset.map(([t, n]) => (
              <div key={t} className="flex items-center justify-between text-sm border-b border-line/50 pb-1.5 last:border-0">
                <span>{ASSET_LABEL[t as AssetType] ?? t}</span>
                <span className="tabular-nums font-medium">{n}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
