export function parseMoney(input: string): number | null {
  const s = input.trim().replace(/[$,\s]/g, "");
  if (!s) return null;
  const m = s.match(/^(-?\d+(?:\.\d+)?)([kmb])?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const suf = (m[2] || "").toLowerCase();
  if (suf === "k") return n * 1_000;
  if (suf === "m") return n * 1_000_000;
  if (suf === "b") return n * 1_000_000_000;
  if (Math.abs(n) < 10_000) return n * 1_000_000;
  return n;
}

function trimNum(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${trimNum(abs / 1e9)}B`;
  if (abs >= 1_000_000) return `${sign}$${trimNum(abs / 1e6)}M`;
  if (abs >= 1_000) return `${sign}$${trimNum(abs / 1e3)}K`;
  return `${sign}$${Math.round(abs)}`;
}

export function formatMoneyExact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return `$${Math.round(Number(value)).toLocaleString("en-US")}`;
}

export function formatSignedMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(n))}`;
}
