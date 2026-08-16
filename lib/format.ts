import type { ReleaseRow } from "@/movie_catalog/types";

export function formatDate(
  iso: string | null | undefined,
  fallback?: string | null
): string {
  if (!iso) return fallback || "Date TBD";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return fallback || iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "TBD";
  const day = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) {
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return iso;
    return t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Tailwind classes for a release-type pill. */
export function releaseTypeClass(type: string | null | undefined): string {
  switch ((type || "").toLowerCase()) {
    case "wide":
    case "expands wide":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30";
    case "limited":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30";
    case "imax":
      return "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/30";
    case "special engagement":
      return "bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-inset ring-fuchsia-500/30";
    default:
      return "bg-white/10 text-zinc-300 ring-1 ring-inset ring-white/20";
  }
}

/** Choose the release to feature: earliest Wide, else earliest non-re-release. */
export function primaryReleaseRow(
  releases: ReleaseRow[] | undefined
): ReleaseRow | null {
  if (!releases?.length) return null;
  const theatrical = releases.filter((r) => !r.is_re_release);
  const pool = theatrical.length ? theatrical : releases;
  const sorted = [...pool].sort((a, b) =>
    (a.release_date || "9999-12-31").localeCompare(b.release_date || "9999-12-31")
  );
  return sorted.find((r) => (r.release_type || "").toLowerCase() === "wide") || sorted[0];
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}
