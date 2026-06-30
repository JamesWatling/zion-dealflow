"use client";

import { useState } from "react";
import type { OfferStatus } from "@/lib/types";

export function OfferPanel(props: {
  dealId: string;
  recipient?: string;
  subject?: string;
  emailBody?: string;
  status: OfferStatus;
  sentAt?: string;
  hasPdf: boolean;
}) {
  const [recipient, setRecipient] = useState(props.recipient ?? "");
  const [subject, setSubject] = useState(props.subject ?? "");
  const [body, setBody] = useState(props.emailBody ?? "");
  const [status, setStatus] = useState<OfferStatus>(props.status);
  const [busy, setBusy] = useState<"" | "save" | "send">("");
  const [msg, setMsg] = useState<{ text: string; err?: boolean } | null>(null);

  const sent = status === "sent" || status === "replied";

  async function persist(): Promise<boolean> {
    const res = await fetch(`/api/offers/${props.dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient, subject, emailBody: body }),
    });
    return res.ok;
  }

  async function save() {
    setBusy("save");
    setMsg(null);
    try {
      setMsg((await persist()) ? { text: "Saved" } : { text: "Save failed", err: true });
    } finally {
      setBusy("");
    }
  }

  async function send() {
    if (!recipient.includes("@")) return setMsg({ text: "Add a recipient email first", err: true });
    if (!confirm(`Send this offer to ${recipient}?`)) return;
    setBusy("send");
    setMsg(null);
    try {
      // never send stale content: abort if the save didn't persist
      if (!(await persist())) {
        setMsg({ text: "Couldn't save edits — not sent", err: true });
        return;
      }
      const res = await fetch(`/api/offers/${props.dealId}/send`, { method: "POST" });
      const out = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("sent");
        setMsg({ text: "Sent ✓" });
      } else {
        setMsg({ text: out.error || "Send failed", err: true });
      }
    } finally {
      setBusy("");
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm text-emerald-800">
        ✓ Sent{props.sentAt ? ` · ${new Date(props.sentAt).toLocaleDateString()}` : ""}
        <div className="mt-1 text-xs text-emerald-700">To: {recipient}</div>
        {props.hasPdf && (
          <a href={`/api/offers/${props.dealId}/pdf`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs underline">
            View offer PDF
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="recipient@email.com"
        className="w-full rounded-md border border-line bg-cream px-2 py-1.5 text-xs focus:outline-2 focus:outline-ember"
      />
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className="w-full rounded-md border border-line bg-cream px-2 py-1.5 text-xs font-medium focus:outline-2 focus:outline-ember"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        className="w-full rounded-md border border-line bg-cream p-2 text-xs leading-relaxed focus:outline-2 focus:outline-ember"
      />
      <div className="flex gap-2">
        <button
          onClick={send}
          disabled={!!busy}
          className="flex-1 rounded-lg bg-canyon px-3 py-2 text-sm font-semibold text-white hover:bg-canyon-dark disabled:opacity-60"
        >
          {busy === "send" ? "Sending…" : "Approve & Send"}
        </button>
        <button
          onClick={save}
          disabled={!!busy}
          className="rounded-lg border border-line px-3 py-2 text-sm text-ink-soft hover:bg-sand disabled:opacity-60"
        >
          {busy === "save" ? "Saving…" : "Save"}
        </button>
      </div>
      {msg && <p className={`text-xs ${msg.err ? "text-canyon" : "text-emerald-700"}`}>{msg.text}</p>}
      {props.hasPdf ? (
        <a href={`/api/offers/${props.dealId}/pdf`} target="_blank" rel="noreferrer" className="block text-xs text-canyon hover:underline">
          📄 Preview offer PDF
        </a>
      ) : (
        <span className="block text-xs text-ink-soft">
          PDF not generated — run <code>npm run pdf</code>
        </span>
      )}
    </div>
  );
}
