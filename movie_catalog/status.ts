import type { MovieStatus } from "./types";

export function computeStatus(releaseDate: string | null | undefined): MovieStatus {
  if (!releaseDate) return "PRE_RELEASE";
  const release = new Date(`${releaseDate}T00:00:00Z`);
  if (Number.isNaN(release.getTime())) return "PRE_RELEASE";
  const now = new Date();
  if (now < release) return "PRE_RELEASE";
  const weekendEnd = new Date(release);
  weekendEnd.setUTCDate(weekendEnd.getUTCDate() + 3);
  if (now <= weekendEnd) return "WEEKEND_LIVE";
  const yearEnd = new Date(
    Date.UTC(release.getUTCFullYear(), 11, 31, 23, 59, 59)
  );
  if (now <= yearEnd) return "POST_OPENING";
  return "COMPLETED";
}

export function statusLabel(status: MovieStatus): string {
  switch (status) {
    case "PRE_RELEASE":
      return "Pre-release";
    case "WEEKEND_LIVE":
      return "Weekend live";
    case "POST_OPENING":
      return "Tracking";
    case "COMPLETED":
      return "Completed";
  }
}

export function statusClass(status: MovieStatus): string {
  switch (status) {
    case "PRE_RELEASE":
      return "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/30";
    case "WEEKEND_LIVE":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30";
    case "POST_OPENING":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30";
    case "COMPLETED":
      return "bg-white/10 text-zinc-300 ring-1 ring-inset ring-white/20";
  }
}
