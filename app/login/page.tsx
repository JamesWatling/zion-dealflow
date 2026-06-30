"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setErr((await res.json().catch(() => ({}))).error || "Login failed");
        return;
      }
      // only allow same-origin relative paths (no open redirect)
      const raw = new URLSearchParams(window.location.search).get("next") || "/";
      const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
      window.location.href = next;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-white p-7">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-canyon text-white font-bold">Z</span>
          <span className="font-semibold">Zion Dealflow</span>
        </div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-sm focus:outline-2 focus:outline-ember"
        />
        {err && <p className="text-sm text-canyon mt-2">{err}</p>}
        <button
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-canyon px-4 py-2.5 text-sm font-semibold text-white hover:bg-canyon-dark disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
