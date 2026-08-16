export type ForecastType = "opening_weekend" | "end_of_month" | "end_of_year";

export const FORECAST_TYPES: { id: ForecastType; label: string }[] = [
  { id: "opening_weekend", label: "Opening Weekend" },
  { id: "end_of_month", label: "End of Month" },
  { id: "end_of_year", label: "End of Year" },
];

export interface ForecastRow {
  id: string;
  movie_id: string;
  forecast_type: ForecastType;
  value: number;
  note: string | null;
  created_at: string;
}

export function forecastLabel(type: ForecastType): string {
  return FORECAST_TYPES.find((t) => t.id === type)?.label ?? type;
}
