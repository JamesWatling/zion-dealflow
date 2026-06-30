// Analysis worker (M3). Underwrites un-analyzed deals via the Claude Code CLI
// (`claude -p`) and writes back analysis + a drafted offer. Run on a machine
// with Claude Code installed + logged in:  npm run analyze [-- --limit=5 --id=<id>]
import { getDeals, getDeal, updateProperty } from "../lib/store";
import { hasDb } from "../lib/db/client";
import { runClaudeJSON } from "../lib/claude";
import { buildAnalysisPrompt, type AnalysisResult } from "../lib/analyze-prompt";
import type { Property } from "../lib/types";

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const LIMIT = (() => {
  const n = Number(arg("limit"));
  return Number.isInteger(n) && n > 0 ? n : 5;
})();
const ONLY = arg("id");
const ANALYZABLE = ["sourced", "screening", "analyzed"];
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function needsAnalysis(d: Property) {
  return ANALYZABLE.includes(d.stage) && (!d.analysis || !d.offer);
}

function isValidResult(r: unknown): r is AnalysisResult {
  if (!r || typeof r !== "object") return false;
  const a = (r as AnalysisResult).analysis;
  return (
    !!a &&
    typeof a === "object" &&
    typeof a.offerPrice === "number" &&
    typeof a.fitScore === "number" &&
    Array.isArray(a.financing) &&
    typeof a.summary === "string"
  );
}

async function analyzeOne(d: Property) {
  console.log(`• analyzing ${d.id} — ${d.name}`);
  const r = await runClaudeJSON<AnalysisResult>(buildAnalysisPrompt(d), { timeoutMs: 300000 });
  if (!isValidResult(r)) throw new Error("Claude returned an invalid/incomplete analysis shape");

  const fit = r.analysis.fitScore ?? 0;
  const hasOffer = !!(r.offer?.subject && r.offer?.emailBody);
  // weak fit → archive; ready offer → outbox (awaiting approval); else hold at analyzed
  const stage = fit < 5 ? "archived" : hasOffer ? "outbox" : "analyzed";

  // re-read so we don't clobber a stage change made during the analysis window
  const current = await getDeal(d.id);
  if (!current || !ANALYZABLE.includes(current.stage)) {
    console.log(`  ↷ skipped — stage changed to ${current?.stage ?? "deleted"}`);
    return;
  }

  await updateProperty(d.id, {
    analysis: { ...r.analysis, model: "claude-code (claude -p)", generatedAt: new Date().toISOString() },
    offer: hasOffer
      ? { subject: r.offer!.subject, emailBody: r.offer!.emailBody, recipient: r.offer!.recipient ?? d.contact?.email, status: "draft" }
      : current.offer,
    contact: r.contact ?? current.contact,
    fitScore: fit,
    stage,
  });
  console.log(`  → ${stage} (fit ${fit}, offer ${r.analysis.offerPrice ?? "—"})`);
}

async function main() {
  if (!hasDb) {
    console.warn("⚠ DATABASE_URL not set — analysis writes to the in-memory store only and won't reach the running app. Set DATABASE_URL to persist.");
  }
  let todo: Property[];
  if (ONLY) {
    const d = await getDeal(ONLY);
    if (!d) return console.error(`no deal ${ONLY}`);
    todo = [d];
  } else {
    todo = (await getDeals()).filter(needsAnalysis).slice(0, LIMIT);
  }
  if (!todo.length) return console.log("nothing to analyze.");
  console.log(`Analyzing ${todo.length} deal(s) via claude -p…`);
  for (const d of todo) {
    try {
      await analyzeOne(d);
    } catch (e) {
      console.error(`  ✗ ${d.id}: ${msg(e)}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
