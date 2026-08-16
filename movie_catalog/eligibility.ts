import type { DomesticRelease } from "./types";

export const THEATRICAL_TYPES = [
  "Wide",
  "Limited",
  "IMAX",
  "Expands Wide",
  "Special Engagement",
] as const;

export function isTheatrical(type: string | null | undefined): boolean {
  const t = (type || "").toLowerCase();
  return THEATRICAL_TYPES.some((k) => k.toLowerCase() === t);
}

export interface EligibilityVerdict {
  eligible: boolean;
  reason: string;
  primary: DomesticRelease | null;
}

export function evaluateEligibility(
  domesticReleases: DomesticRelease[]
): EligibilityVerdict {
  if (!domesticReleases.length) {
    return {
      eligible: false,
      reason: "No domestic release listed on The Numbers.",
      primary: null,
    };
  }

  const qualifying = domesticReleases.filter(
    (r) => isTheatrical(r.type) && !r.isReRelease && !r.isCanceled
  );

  if (!qualifying.length) {
    let reason =
      "No qualifying domestic theatrical release (Wide, Limited, IMAX, Expands Wide, or Special Engagement).";
    if (domesticReleases.every((r) => r.isCanceled)) {
      reason = "The domestic release is marked as canceled.";
    } else if (domesticReleases.every((r) => r.isReRelease)) {
      reason = "Only re-releases are listed, which are excluded from tracking.";
    }
    return { eligible: false, reason, primary: null };
  }

  const sorted = [...qualifying].sort((a, b) =>
    (a.date || "9999-12-31").localeCompare(b.date || "9999-12-31")
  );
  const primary =
    sorted.find((r) => r.type.toLowerCase() === "wide") || sorted[0];

  const distributor = primary.distributor ? ` by ${primary.distributor}` : "";
  const reason = `Eligible: ${primary.type} domestic release${distributor}.`.replace(
    /\.{2,}$/,
    "."
  );
  return { eligible: true, reason, primary };
}
