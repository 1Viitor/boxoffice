import type { MovieStatus } from "@/movie_catalog/types";
import type {
  AiSignals,
  CanonicalSnapshot,
  Confidence,
  ProjectionResult,
} from "./types";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function fridayMultiplier(band: AiSignals["multiplier_band"]): number {
  switch (band) {
    case "front_loaded":
      return 2.35;
    case "leggy":
      return 3.15;
    default:
      return 2.75;
  }
}

function friSatMultiplier(band: AiSignals["multiplier_band"]): number {
  switch (band) {
    case "front_loaded":
      return 1.32;
    case "leggy":
      return 1.48;
    default:
      return 1.4;
  }
}

function previewMultiplier(band: AiSignals["multiplier_band"]): number {
  switch (band) {
    case "front_loaded":
      return 9;
    case "leggy":
      return 12;
    default:
      return 10.5;
  }
}

function weightedCompAverage(comps: AiSignals["comps"]): number | null {
  if (!comps.length) return null;
  let weightSum = 0;
  let total = 0;
  for (const c of comps) {
    const w = clamp(c.similarity, 0.1, 1);
    weightSum += w;
    total += c.opening_weekend * w;
  }
  if (!weightSum) return null;
  return total / weightSum;
}

function nudgeFromSignals(signals: AiSignals): number {
  const presale = signals.presale_index ?? 0;
  const social = signals.social_index ?? 0;
  const rt =
    signals.rt_audience != null
      ? (signals.rt_audience - 70) / 100
      : signals.rt_critic != null
        ? (signals.rt_critic - 70) / 100
        : 0;
  return 1 + presale * 0.12 + social * 0.08 + rt * 0.05;
}

export function projectOpeningWeekend(input: {
  status: MovieStatus;
  canonical: CanonicalSnapshot;
  signals: AiSignals;
}): ProjectionResult {
  const { canonical, signals } = input;

  if (canonical.opening_weekend && canonical.opening_weekend > 0) {
    const point = canonical.opening_weekend;
    return {
      point,
      low: Math.round(point * 0.98),
      high: Math.round(point * 1.02),
      confidence: "high",
      basis: "Canonical opening weekend already reported.",
    };
  }

  if (canonical.friday && canonical.saturday) {
    const m = friSatMultiplier(signals.multiplier_band);
    const point = (canonical.friday + canonical.saturday) * m;
    const spread = 0.1;
    return {
      point: Math.round(point),
      low: Math.round(point * (1 - spread)),
      high: Math.round(point * (1 + spread)),
      confidence: "high",
      basis: `Fri+Sat actuals × ${m.toFixed(2)} (${signals.multiplier_band})`,
    };
  }

  if (canonical.friday) {
    const m = fridayMultiplier(signals.multiplier_band);
    const point = canonical.friday * m;
    const spread = signals.multiplier_band === "front_loaded" ? 0.18 : 0.15;
    return {
      point: Math.round(point),
      low: Math.round(point * (1 - spread)),
      high: Math.round(point * (1 + spread)),
      confidence: "medium",
      basis: `Friday actual × ${m.toFixed(2)} (${signals.multiplier_band})`,
    };
  }

  if (canonical.preview) {
    const m = previewMultiplier(signals.multiplier_band);
    const point = canonical.preview * m;
    const spread = 0.35;
    return {
      point: Math.round(point),
      low: Math.round(point * (1 - spread)),
      high: Math.round(point * (1 + spread)),
      confidence: "low",
      basis: `Thursday previews × ${m.toFixed(1)} (high uncertainty)`,
    };
  }

  const compAvg = weightedCompAverage(signals.comps);
  if (compAvg != null) {
    const nudge = nudgeFromSignals(signals);
    const point = compAvg * nudge;
    const spread = 0.4;
    return {
      point: Math.round(point),
      low: Math.round(point * (1 - spread)),
      high: Math.round(point * (1 + spread)),
      confidence: "low",
      basis: `Comp-weighted estimate from ${signals.comps.length} title(s), adjusted for presale/social/RT signals`,
    };
  }

  return {
    point: 0,
    low: 0,
    high: 0,
    confidence: "low",
    basis: "Insufficient canonical data and no usable comps from research.",
  };
}
