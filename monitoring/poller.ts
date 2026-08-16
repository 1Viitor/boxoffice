import { fetchBoxOffice } from "@/integrations/the-numbers/boxoffice";
import { getTrackedMovies } from "@/movie_catalog/repo";
import { insertCheck, touchMovieCheck } from "@/canonical_data/repo";
import { processSnapshot } from "@/canonical_data/process";
import { pollIntervalForStatus, pollTickMs } from "./config";

let running = false;
let timer: ReturnType<typeof setInterval> | null = null;

export async function checkMovie(input: {
  id: string;
  the_numbers_url: string;
}): Promise<{ ok: boolean; inserted: number }> {
  const result = await fetchBoxOffice(input.the_numbers_url);
  await insertCheck({
    movieId: input.id,
    success: result.ok,
    httpStatus: result.httpStatus || null,
    errorMessage: result.errorMessage,
  });

  if (!result.ok || !result.snapshot) {
    await touchMovieCheck({ movieId: input.id, success: false, changed: false });
    return { ok: false, inserted: 0 };
  }

  const inserted = await processSnapshot(input.id, result.snapshot);
  return { ok: true, inserted };
}

function isDue(lastCheckedAt: string | null | undefined, intervalMs: number): boolean {
  if (!lastCheckedAt) return true;
  const elapsed = Date.now() - new Date(lastCheckedAt).getTime();
  return elapsed >= intervalMs;
}

export async function pollActiveMovies(): Promise<{
  checked: number;
  changed: number;
  failed: number;
  skipped: number;
}> {
  if (running) {
    return { checked: 0, changed: 0, failed: 0, skipped: 0 };
  }
  running = true;
  let checked = 0;
  let changed = 0;
  let failed = 0;
  let skipped = 0;
  try {
    const movies = await getTrackedMovies();
    for (const movie of movies) {
      const interval = pollIntervalForStatus(movie.status);
      if (!isDue(movie.last_checked_at, interval)) {
        skipped += 1;
        continue;
      }
      checked += 1;
      try {
        const result = await checkMovie({
          id: movie.id,
          the_numbers_url: movie.the_numbers_url,
        });
        if (!result.ok) failed += 1;
        if (result.inserted > 0) changed += 1;
      } catch (e) {
        failed += 1;
        await insertCheck({
          movieId: movie.id,
          success: false,
          httpStatus: null,
          errorMessage: (e as Error).message,
        }).catch(() => {});
        await touchMovieCheck({
          movieId: movie.id,
          success: false,
          changed: false,
        }).catch(() => {});
      }
    }
  } finally {
    running = false;
  }
  return { checked, changed, failed, skipped };
}

const g = globalThis as unknown as { __boxofficePoller?: ReturnType<typeof setInterval> };

export function startPoller(): void {
  if (g.__boxofficePoller) return;
  const ms = pollTickMs();
  void pollActiveMovies();
  g.__boxofficePoller = setInterval(() => {
    void pollActiveMovies();
  }, ms);
  timer = g.__boxofficePoller;
  if (timer && typeof timer === "object" && "unref" in timer) {
    (timer as NodeJS.Timeout).unref?.();
  }
}
