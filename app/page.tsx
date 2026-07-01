import { getDeals } from "@/lib/store";
import PipelineView from "@/components/pipeline-view";

export default async function Dashboard() {
  const deals = await getDeals();

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

      <PipelineView deals={deals} />
    </div>
  );
}
