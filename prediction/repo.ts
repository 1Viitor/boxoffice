import { getSupabaseAdmin } from "@/lib/db";
import type {
  AiSignals,
  CanonicalSnapshot,
  Citation,
  Confidence,
  PredictionMode,
  PredictionRow,
} from "./types";

function coercePrediction(row: PredictionRow): PredictionRow {
  return {
    ...row,
    point_estimate: Number(row.point_estimate),
    low: row.low == null ? null : Number(row.low),
    high: row.high == null ? null : Number(row.high),
  };
}

export async function listPredictions(movieId: string): Promise<PredictionRow[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];
  const { data, error } = await db
    .from("predictions")
    .select("*")
    .eq("movie_id", movieId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data as PredictionRow[]) ?? []).map(coercePrediction);
}

export async function latestPrediction(
  movieId: string
): Promise<PredictionRow | null> {
  const rows = await listPredictions(movieId);
  return rows[0] ?? null;
}

export async function insertPrediction(input: {
  movieId: string;
  mode: PredictionMode;
  pointEstimate: number;
  low: number;
  high: number;
  confidence: Confidence;
  rationale: string;
  signals: AiSignals;
  citations: Citation[];
  canonicalSnapshot: CanonicalSnapshot;
  modelVersion: string;
}): Promise<PredictionRow> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Database is not configured.");
  const { data, error } = await db
    .from("predictions")
    .insert({
      movie_id: input.movieId,
      mode: input.mode,
      target_metric: "opening_weekend",
      point_estimate: input.pointEstimate,
      low: input.low,
      high: input.high,
      confidence: input.confidence,
      rationale: input.rationale,
      signals: input.signals,
      citations: input.citations,
      canonical_snapshot: input.canonicalSnapshot,
      model_version: input.modelVersion,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return coercePrediction(data as PredictionRow);
}
