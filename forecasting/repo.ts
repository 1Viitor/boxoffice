import { getSupabaseAdmin } from "@/lib/db";
import type { ForecastRow, ForecastType } from "./types";

export async function listForecasts(movieId: string): Promise<ForecastRow[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];
  const { data, error } = await db
    .from("forecasts")
    .select("*")
    .eq("movie_id", movieId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data as ForecastRow[]) ?? []).map(coerceForecast);
}

export async function listForecastsForMovies(
  movieIds: string[]
): Promise<ForecastRow[]> {
  const db = getSupabaseAdmin();
  if (!db || !movieIds.length) return [];
  const { data, error } = await db
    .from("forecasts")
    .select("*")
    .in("movie_id", movieIds)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data as ForecastRow[]) ?? []).map(coerceForecast);
}

export async function addForecast(input: {
  movieId: string;
  forecastType: ForecastType;
  value: number;
  note?: string | null;
}): Promise<ForecastRow> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Database is not configured.");
  const { data, error } = await db
    .from("forecasts")
    .insert({
      movie_id: input.movieId,
      forecast_type: input.forecastType,
      value: input.value,
      note: input.note?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return coerceForecast(data as ForecastRow);
}

export function latestByType(
  rows: ForecastRow[]
): Partial<Record<ForecastType, ForecastRow>> {
  const out: Partial<Record<ForecastType, ForecastRow>> = {};
  for (const row of rows) {
    const prev = out[row.forecast_type];
    if (!prev || prev.created_at <= row.created_at) out[row.forecast_type] = row;
  }
  return out;
}

function coerceForecast(row: ForecastRow): ForecastRow {
  return { ...row, value: Number(row.value) };
}
