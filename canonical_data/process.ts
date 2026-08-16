import type { CanonicalBoxOfficeSnapshot } from "@/integrations/the-numbers/boxoffice";
import { snapshotMetrics } from "@/integrations/the-numbers/boxoffice";
import {
  insertObservation,
  latestObservation,
  touchMovieCheck,
  updateObservationTheatricalDate,
} from "./repo";

/**
 * Compare a live snapshot to stored observations.
 * Inserts a new row only when a metric's value actually changed.
 * Backfills theatrical_date on the latest row when the value is unchanged.
 */
export async function processSnapshot(
  movieId: string,
  snapshot: CanonicalBoxOfficeSnapshot
): Promise<number> {
  let inserted = 0;
  for (const { metric, value, theatricalDate } of snapshotMetrics(snapshot)) {
    const last = await latestObservation(movieId, metric);
    if (last && Number(last.value) === value) {
      if (theatricalDate && !last.theatrical_date) {
        await updateObservationTheatricalDate(last.id, theatricalDate);
      }
      continue;
    }
    const previous = last ? Number(last.value) : null;
    const absolute = previous == null ? null : value - previous;
    const percentage =
      previous && previous !== 0 ? ((value - previous) / previous) * 100 : null;
    await insertObservation({
      movieId,
      metric,
      value,
      observedAt: snapshot.observedAt,
      theatricalDate,
      previousValue: previous,
      absoluteChange: absolute,
      percentageChange: percentage,
      sourceUrl: snapshot.sourceUrl,
    });
    inserted += 1;
  }
  await touchMovieCheck({
    movieId,
    success: true,
    changed: inserted > 0,
  });
  return inserted;
}
