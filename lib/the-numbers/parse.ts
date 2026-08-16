// Shared parsing helpers for The Numbers pages.

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/** Normalize curly quotes/apostrophes to ASCII. */
export function normalizeText(s: string): string {
  return s
    .replace(/[\u2018\u2019\u02BC\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract the movie slug from a /movie/<slug> URL. */
export function slugFromUrl(url: string): string {
  const m = url.match(/\/movie\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/** Extract a 4-digit year from a slug like "Barbie-(2023)" or "X-(2025-United-Kingdom)". */
export function yearFromSlug(slug: string): number | null {
  const m = slug.match(/\((\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

/** Parse "July 21st, 2023" -> "2023-07-21" (ISO date). Returns null if unparseable. */
export function parseLongDate(text: string): string | null {
  const m = text.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,\s*(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (month === undefined) return null;
  const day = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  const d = new Date(Date.UTC(year, month, day));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Parse a month/day without year, e.g. "November 6" -> {month, day}. */
export function parseMonthDay(
  text: string
): { month: number; day: number } | null {
  const m = text.match(/([A-Za-z]+)\s+(\d{1,2})\b/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (month === undefined) return null;
  return { month, day: parseInt(m[2], 10) };
}

export interface ParsedReleaseType {
  type: string;
  isReRelease: boolean;
  isCanceled: boolean;
  raw: string;
}

const KNOWN_TYPES = [
  "Wide",
  "Limited",
  "IMAX",
  "Expands Wide",
  "Special Engagement",
];

/**
 * Parse the parenthetical release descriptor, e.g. "Wide",
 * "Limited, re-release", "Wide, re-release", "Canceled".
 */
export function parseReleaseType(inside: string): ParsedReleaseType {
  const raw = normalizeText(inside);
  const parts = raw.split(",").map((p) => p.trim());
  const isReRelease = parts.some((p) => /re-?release/i.test(p));
  const isCanceled = parts.some((p) => /cancel/i.test(p));
  const first = parts[0] || "";
  const known = KNOWN_TYPES.find((k) => k.toLowerCase() === first.toLowerCase());
  return { type: known || first, isReRelease, isCanceled, raw };
}

/**
 * Split the trailing "(Type...)" descriptor off a schedule title.
 * "Dr. Seuss' The Cat in the Hat(Wide)" -> { title, typeInfo }
 */
export function splitTitleAndType(movieCell: string): {
  title: string;
  typeInfo: ParsedReleaseType | null;
} {
  const text = normalizeText(movieCell);
  const m = text.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (!m) return { title: text, typeInfo: null };
  return { title: m[1].trim(), typeInfo: parseReleaseType(m[2]) };
}
