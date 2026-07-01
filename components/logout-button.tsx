"use client";

export function LogoutButton() {
  async function out() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }
  return (
    <button onClick={out} className="text-xs text-ink-soft hover:text-canyon">
      Sign out
    </button>
  );
}
