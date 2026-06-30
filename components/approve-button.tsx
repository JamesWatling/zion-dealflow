"use client";

import { useState } from "react";
import type { OfferStatus } from "@/lib/types";

export function ApproveButton({ dealId, status, sentAt }: { dealId: string; status: OfferStatus; sentAt?: string }) {
  const [state, setState] = useState<OfferStatus>(status);
  const [busy, setBusy] = useState(false);

  if (state === "sent" || state === "replied") {
    return (
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">
        ✓ Sent{sentAt ? ` · ${new Date(sentAt).toLocaleDateString()}` : ""}
      </div>
    );
  }

  async function approveAndSend() {
    setBusy(true);
    try {
      // M5: POST /api/offers/[id]/send → Resend. Stubbed until the send route exists.
      const res = await fetch(`/api/offers/${dealId}/send`, { method: "POST" }).catch(() => null);
      if (res && res.ok) setState("sent");
      else {
        alert("Send route (M5) not wired yet — this is where the approved offer goes out via Resend with the PDF attached.");
        setState("approved");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={approveAndSend}
        disabled={busy}
        className="flex-1 rounded-lg bg-canyon px-3 py-2 text-sm font-semibold text-white hover:bg-canyon-dark disabled:opacity-60 transition"
      >
        {busy ? "Sending…" : state === "approved" ? "Approved — send" : "Approve & Send"}
      </button>
      <button className="rounded-lg border border-line px-3 py-2 text-sm text-ink-soft hover:bg-sand transition">Edit</button>
    </div>
  );
}
