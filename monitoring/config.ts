export function pollIntervalMs(): number {
  const minutes = Number(process.env.THE_NUMBERS_POLL_INTERVAL_MINUTES);
  const n = Number.isFinite(minutes) && minutes > 0 ? minutes : 10;
  return n * 60 * 1000;
}

export function uiRefreshMs(): number {
  const seconds = Number(process.env.UI_REFRESH_SECONDS);
  const n = Number.isFinite(seconds) && seconds > 0 ? seconds : 45;
  return n * 1000;
}
