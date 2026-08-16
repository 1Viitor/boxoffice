export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { isDbConfigured } = await import("./lib/db");
  if (!isDbConfigured()) return;
  const { startPoller } = await import("./monitoring/poller");
  startPoller();
}
