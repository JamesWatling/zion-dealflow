export const money = (n?: number) =>
  n == null ? "—" : n >= 1000 ? "$" + Math.round(n).toLocaleString() : "$" + n;

export const moneyShort = (n?: number) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2).replace(/\.00$/, "") + "M";
  if (n >= 1000) return "$" + Math.round(n / 1000) + "K";
  return "$" + n;
};

export const pct = (n?: number) => (n == null ? "—" : (n * 100).toFixed(1) + "%");

export const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "1 day ago";
  if (d < 30) return `${d} days ago`;
  return `${Math.floor(d / 30)} mo ago`;
};
