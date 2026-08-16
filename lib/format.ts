import type { ReleaseRow } from "./types";

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
