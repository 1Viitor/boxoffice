import type { MovieStatus } from "@/movie_catalog/types";

export function pollIntervalMs(): number {
  const minutes = Number(process.env.THE_NUMBERS_POLL_INTERVAL_MINUTES);
  const n = Number.isFinite(minutes) && minutes > 0 ? minutes : 15;
  return n * 60 * 1000;
}

export function pollWeekendIntervalMs(): number {
  const minutes = Number(process.env.THE_NUMBERS_POLL_WEEKEND_MINUTES);
  const n = Number.isFinite(minutes) && minutes > 0 ? minutes : 5;
  return n * 60 * 1000;
}

export function pollIntervalForStatus(status: MovieStatus): number {
  if (status === "WEEKEND_LIVE") return pollWeekendIntervalMs();
  return pollIntervalMs();
}

/** How often the poller wakes to check which movies are due. */
export function pollTickMs(): number {
  return 60 * 1000;
}

export function uiRefreshMs(): number {
  const seconds = Number(process.env.UI_REFRESH_SECONDS);
  const n = Number.isFinite(seconds) && seconds > 0 ? seconds : 45;
  return n * 1000;
}
