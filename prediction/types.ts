import type { MovieStatus } from "@/movie_catalog/types";

export const MODEL_VERSION = "v1";

export type PredictionMode = "pre_release" | "weekend_live" | "post_opening";

export type Confidence = "low" | "medium" | "high";

export interface CanonicalSnapshot {
  preview?: number;
  friday?: number;
  saturday?: number;
  sunday?: number;
  opening_weekend?: number;
}

export interface CompTitle {
  title: string;
  opening_weekend: number;
  similarity: number;
}

export interface AiSignals {
  multiplier_band: "front_loaded" | "normal" | "leggy";
  comps: CompTitle[];
  presale_index: number | null;
  social_index: number | null;
  rt_critic: number | null;
  rt_audience: number | null;
  theater_count: number | null;
  rationale: string;
}

export interface Citation {
  title: string;
  url: string;
}

export interface ProjectionResult {
  point: number;
  low: number;
  high: number;
  confidence: Confidence;
  basis: string;
}

export interface PredictionRow {
  id: string;
  movie_id: string;
  created_at: string;
  mode: PredictionMode;
  target_metric: string;
  point_estimate: number;
  low: number | null;
  high: number | null;
  confidence: Confidence | null;
  rationale: string | null;
  signals: AiSignals | null;
  citations: Citation[] | null;
  canonical_snapshot: CanonicalSnapshot | null;
  model_version: string | null;
}

export function modeFromStatus(status: MovieStatus): PredictionMode {
  switch (status) {
    case "PRE_RELEASE":
      return "pre_release";
    case "WEEKEND_LIVE":
      return "weekend_live";
    default:
      return "post_opening";
  }
}
