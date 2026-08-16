export const CANONICAL_METRICS = [
  { id: "preview", label: "Preview" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
  { id: "opening_weekend", label: "Opening Weekend" },
  { id: "domestic_total", label: "Domestic Total" },
] as const;

export type CanonicalMetric = (typeof CANONICAL_METRICS)[number]["id"];

export interface ObservationRow {
  id: string;
  movie_id: string;
  metric: string;
  value: number;
  observed_at: string;
  theatrical_date: string | null;
  previous_value: number | null;
  absolute_change: number | null;
  percentage_change: number | null;
  source_url: string | null;
  is_final?: boolean;
}

export interface CheckRow {
  id: string;
  movie_id: string;
  checked_at: string;
  success: boolean;
  http_status: number | null;
  error_message: string | null;
}

export function metricLabel(metric: string): string {
  return CANONICAL_METRICS.find((m) => m.id === metric)?.label ?? metric;
}
