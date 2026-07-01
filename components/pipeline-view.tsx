"use client";

import { useState } from "react";
import Link from "next/link";
import { ASSET_LABEL, dealCategory, type DealStage, type DealCategory, type Property } from "@/lib/types";
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

type Tab = "all" | DealCategory;

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "commercial", label: "Commercial" },
  { key: "single_family", label: "Single-Family" },
];

export default function PipelineView({ deals }: { deals: Property[] }) {
  const [tab, setTab] = useState<Tab>("all");

  const counts = {
    all: deals.length,
    commercial: deals.filter((d) => dealCategory(d.assetType) === "commercial").length,
    single_family: deals.filter((d) => dealCategory(d.assetType) === "single_family").length,
  };

  const shown = tab === "all" ? deals : deals.filter((d) => dealCategory(d.assetType) === tab);

  const stageCount = (s: DealStage) => shown.filter((d) => d.stage === s).length;
  const stats = [
    { label: "In pipeline", value: shown.filter((d) => d.stage !== "archived").length },
    { label: "Awaiting approval", value: stageCount("outbox"), hot: true },
    { label: "Analyzed", value: stageCount("analyzed") },
    { label: "Sent", value: stageCount("sent") },
  ];

  const outbox = shown.filter((d) => d.stage === "outbox");

  return (
    <>
      {/* category tabs */}
      <div className="inline-flex rounded-lg border border-line bg-white p-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${
              tab === t.key ? "bg-canyon text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
            <span className={`ml-1.5 tabular-nums ${tab === t.key ? "text-white/70" : "text-ink-soft/60"}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft mb-3">
          {tab === "single_family" ? "Single-family deals" : tab === "commercial" ? "Commercial deals" : "All deals"}
        </h2>
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
              {shown.map((d) => (
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
        <p className="text-xs text-ink-soft mt-3">
          Seeded with real deals from the acquisitions research. Single-family steals added 2026-07-01 (rents estimated). Live data lands in M2 (Neon).
        </p>
      </section>
    </>
  );
}
