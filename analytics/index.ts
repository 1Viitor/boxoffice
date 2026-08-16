import type { ForecastRow, ForecastType } from "@/forecasting/types";
import type { ObservationRow } from "@/canonical_data/types";

export interface ResolvedPrediction {
  movieId: string;
  forecastType: ForecastType;
  forecastValue: number;
  actualValue: number;
  errorPct: number;
}

export interface PerformanceSummary {
  resolved: number;
  averageError: number | null;
  bestError: number | null;
}

export function percentChange(from: number, to: number): number | null {
  if (!from) return null;
  return ((to - from) / from) * 100;
}

export function forecastErrorPct(forecast: number, actual: number): number | null {
  if (!actual) return null;
  return ((forecast - actual) / actual) * 100;
}

function canonicalForType(
  observations: ObservationRow[],
  type: ForecastType
): ObservationRow | null {
  const matches = observations.filter((o) => o.metric === type && o.is_final);
  if (!matches.length) return null;
  return matches[matches.length - 1];
}

export function resolvePredictions(
  movieId: string,
  forecasts: ForecastRow[],
  observations: ObservationRow[],
  types: ForecastType[] = ["opening_weekend", "end_of_month", "end_of_year"]
): ResolvedPrediction[] {
  const out: ResolvedPrediction[] = [];
  for (const type of types) {
    const actual = canonicalForType(observations, type);
    const series = forecasts.filter((f) => f.forecast_type === type);
    const latest = series[series.length - 1];
    if (!actual || !latest) continue;
    const err = forecastErrorPct(latest.value, actual.value);
    if (err == null) continue;
    out.push({
      movieId,
      forecastType: type,
      forecastValue: latest.value,
      actualValue: actual.value,
      errorPct: err,
    });
  }
  return out;
}

export function summarizePerformance(
  resolved: ResolvedPrediction[]
): PerformanceSummary {
  if (!resolved.length) {
    return { resolved: 0, averageError: null, bestError: null };
  }
  const abs = resolved.map((r) => Math.abs(r.errorPct));
  const averageError = abs.reduce((a, b) => a + b, 0) / abs.length;
  const bestError = Math.min(...abs);
  return { resolved: resolved.length, averageError, bestError };
}

export function formatError(pct: number | null | undefined): string {
  if (pct == null || !Number.isFinite(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}
