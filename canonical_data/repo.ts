import { getSupabaseAdmin } from "@/lib/db";
import type { CheckRow, ObservationRow } from "./types";

function coerceObs(row: ObservationRow): ObservationRow {
  return {
    ...row,
    value: Number(row.value),
    previous_value:
      row.previous_value == null ? null : Number(row.previous_value),
    absolute_change:
      row.absolute_change == null ? null : Number(row.absolute_change),
    percentage_change:
      row.percentage_change == null ? null : Number(row.percentage_change),
  };
}

export async function listObservations(
  movieId: string
): Promise<ObservationRow[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];
  const { data, error } = await db
    .from("canonical_observations")
    .select("*")
    .eq("movie_id", movieId)
    .order("observed_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data as ObservationRow[]) ?? []).map(coerceObs);
}

export async function listObservationsForMovies(
  movieIds: string[]
): Promise<ObservationRow[]> {
  const db = getSupabaseAdmin();
  if (!db || !movieIds.length) return [];
  const { data, error } = await db
    .from("canonical_observations")
    .select("*")
    .in("movie_id", movieIds)
    .order("observed_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data as ObservationRow[]) ?? []).map(coerceObs);
}

export async function latestObservation(
  movieId: string,
  metric: string
): Promise<ObservationRow | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const { data, error } = await db
    .from("canonical_observations")
    .select("*")
    .eq("movie_id", movieId)
    .eq("metric", metric)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? coerceObs(data as ObservationRow) : null;
}

export async function insertObservation(input: {
  movieId: string;
  metric: string;
  value: number;
  observedAt: string;
  theatricalDate: string | null;
  previousValue: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  sourceUrl: string | null;
}): Promise<ObservationRow> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Database is not configured.");
  const { data, error } = await db
    .from("canonical_observations")
    .insert({
      movie_id: input.movieId,
      metric: input.metric,
      value: input.value,
      observed_at: input.observedAt,
      theatrical_date: input.theatricalDate,
      previous_value: input.previousValue,
      absolute_change: input.absoluteChange,
      percentage_change: input.percentageChange,
      source_url: input.sourceUrl,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return coerceObs(data as ObservationRow);
}

export async function updateObservationTheatricalDate(
  observationId: string,
  theatricalDate: string
): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Database is not configured.");
  const { error } = await db
    .from("canonical_observations")
    .update({ theatrical_date: theatricalDate })
    .eq("id", observationId);
  if (error) throw new Error(error.message);
}

export async function insertCheck(input: {
  movieId: string;
  success: boolean;
  httpStatus: number | null;
  errorMessage: string | null;
}): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) return;
  await db.from("canonical_checks").insert({
    movie_id: input.movieId,
    success: input.success,
    http_status: input.httpStatus,
    error_message: input.errorMessage,
  });
}

export async function listRecentChecks(
  movieId: string,
  limit = 20
): Promise<CheckRow[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];
  const { data, error } = await db
    .from("canonical_checks")
    .select("*")
    .eq("movie_id", movieId)
    .order("checked_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as CheckRow[]) ?? [];
}

export async function touchMovieCheck(input: {
  movieId: string;
  success: boolean;
  changed: boolean;
}): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) return;
  const now = new Date().toISOString();
  const patch: Record<string, string> = {
    last_checked_at: now,
    updated_at: now,
  };
  if (input.success) patch.last_successful_check_at = now;
  if (input.changed) patch.last_canonical_change_at = now;
  await db.from("movies").update(patch).eq("id", input.movieId);
}

export function observationsForMetric(
  rows: ObservationRow[],
  metric: string
): ObservationRow[] {
  return rows.filter((r) => r.metric === metric);
}

export function latestByMetric(
  rows: ObservationRow[]
): Record<string, ObservationRow> {
  const out: Record<string, ObservationRow> = {};
  for (const row of rows) {
    const prev = out[row.metric];
    if (!prev || prev.observed_at <= row.observed_at) out[row.metric] = row;
  }
  return out;
}
