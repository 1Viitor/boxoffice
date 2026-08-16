import { listObservations, latestByMetric } from "@/canonical_data/repo";
import { researchMovieSignals } from "@/integrations/openai/research";
import { getMovieById } from "@/movie_catalog/repo";
import { primaryReleaseRow } from "@/lib/format";
import { projectOpeningWeekend } from "./model";
import { insertPrediction } from "./repo";
import {
  MODEL_VERSION,
  modeFromStatus,
  type CanonicalSnapshot,
  type PredictionRow,
} from "./types";

function snapshotFromObservations(
  latest: ReturnType<typeof latestByMetric>
): CanonicalSnapshot {
  const snap: CanonicalSnapshot = {};
  if (latest.preview) snap.preview = latest.preview.value;
  if (latest.friday) snap.friday = latest.friday.value;
  if (latest.saturday) snap.saturday = latest.saturday.value;
  if (latest.sunday) snap.sunday = latest.sunday.value;
  if (latest.opening_weekend) snap.opening_weekend = latest.opening_weekend.value;
  return snap;
}

export async function predictOpeningWeekend(
  movieId: string
): Promise<PredictionRow> {
  const movie = await getMovieById(movieId);
  if (!movie) throw new Error("Movie not found.");

  const observations = await listObservations(movieId);
  const latest = latestByMetric(observations);
  const canonical = snapshotFromObservations(latest);
  const rel = primaryReleaseRow(movie.releases);
  const mode = modeFromStatus(movie.status);

  const { signals, citations } = await researchMovieSignals({
    title: movie.title,
    year: movie.year,
    distributor: rel?.distributor ?? null,
    releaseDate: rel?.release_date ?? null,
    releaseType: rel?.release_type ?? null,
    status: movie.status,
    canonical,
  });

  const projection = projectOpeningWeekend({
    status: movie.status,
    canonical,
    signals,
  });

  const rationale = [projection.basis, signals.rationale]
    .filter(Boolean)
    .join(" ");

  return insertPrediction({
    movieId,
    mode,
    pointEstimate: projection.point,
    low: projection.low,
    high: projection.high,
    confidence: projection.confidence,
    rationale,
    signals,
    citations,
    canonicalSnapshot: canonical,
    modelVersion: MODEL_VERSION,
  });
}
