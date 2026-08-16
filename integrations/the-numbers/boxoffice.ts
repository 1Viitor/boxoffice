import * as cheerio from "cheerio";
import { tnFetch, absoluteUrl } from "./client";
import { normalizeText } from "./parse";

export type BoxOfficeMetric =
  | "preview"
  | "friday"
  | "saturday"
  | "sunday"
  | "opening_weekend"
  | "domestic_total";

export const BOX_OFFICE_METRICS: BoxOfficeMetric[] = [
  "preview",
  "friday",
  "saturday",
  "sunday",
  "opening_weekend",
  "domestic_total",
];

export interface CanonicalBoxOfficeSnapshot {
  preview: number | null;
  friday: number | null;
  saturday: number | null;
  sunday: number | null;
  opening_weekend: number | null;
  domestic_total: number | null;
  dates: Partial<Record<BoxOfficeMetric, string>>;
  observedAt: string;
  sourceUrl: string;
}

export interface BoxOfficeFetchResult {
  ok: boolean;
  httpStatus: number;
  snapshot: CanonicalBoxOfficeSnapshot | null;
  sourceUrl: string;
  errorMessage: string | null;
}

export function parseDollarCell(text: string): number | null {
  const cleaned = normalizeText(text).replace(/,/g, "");
  const m = cleaned.match(/\$?\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function tableAfterHeading($: cheerio.CheerioAPI, heading: string) {
  const h = $("h2")
    .filter((_i, el) => normalizeText($(el).text()).toLowerCase() === heading.toLowerCase())
    .first();
  if (!h.length) return cheerio.load("<table></table>")("table").first();
  return h.nextAll("div").find("table").first().length
    ? h.nextAll("div").find("table").first()
    : h.nextAll("table").first();
}

function dateFromHref(href: string | undefined): Date | null {
  if (!href) return null;
  const m = href.match(/\/(\d{4})\/(\d{2})\/(\d{2})/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoDateFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoDateFromHref(href: string | undefined): string | null {
  const d = dateFromHref(href);
  return d ? isoDateFromDate(d) : null;
}

/** Parse a The Numbers movie HTML page into a normalized snapshot. */
export function parseBoxOfficeHtml(
  html: string,
  sourceUrl: string,
  observedAt = new Date().toISOString()
): CanonicalBoxOfficeSnapshot {
  const $ = cheerio.load(html);
  const snapshot: CanonicalBoxOfficeSnapshot = {
    preview: null,
    friday: null,
    saturday: null,
    sunday: null,
    opening_weekend: null,
    domestic_total: null,
    dates: {},
    observedAt,
    sourceUrl,
  };

  $("#movie_finances tr").each((_i, tr) => {
    const label = normalizeText($(tr).find("td").first().text());
    if (/^Domestic Box Office$/i.test(label)) {
      const v = parseDollarCell($(tr).find("td.data").first().text());
      if (v && !snapshot.domestic_total) snapshot.domestic_total = v;
    }
  });

  const weekend = tableAfterHeading($, "Weekend Box Office Performance");
  weekend.find("tr").each((_i, tr) => {
    if (snapshot.opening_weekend) return;
    const cells = $(tr).children("td");
    if (cells.length < 3) return;
    const weekText = normalizeText($(cells[cells.length - 1]).text());
    if (weekText !== "1") return;
    snapshot.opening_weekend = parseDollarCell($(cells[2]).text());
    const href = $(cells[0]).find("a").attr("href");
    const date = isoDateFromHref(href);
    if (date) snapshot.dates.opening_weekend = date;
  });

  const daily = tableAfterHeading($, "Daily Box Office Performance");
  const firstByWeekday: Partial<Record<number, number>> = {};
  const dateByWeekday: Partial<Record<number, string>> = {};
  daily.find("tr").each((_i, tr) => {
    const cells = $(tr).children("td");
    if (cells.length < 3) return;
    const rank = normalizeText($(cells[1]).text());
    const gross = parseDollarCell($(cells[2]).text());
    if (!gross) return;
    const href = $(cells[0]).find("a").attr("href");
    const date = isoDateFromHref(href);
    if (/^P$/i.test(rank) && !snapshot.preview) {
      snapshot.preview = gross;
      if (date) snapshot.dates.preview = date;
      return;
    }
    const parsed = dateFromHref(href);
    if (!parsed) return;
    const dow = parsed.getUTCDay();
    if (firstByWeekday[dow] == null) {
      firstByWeekday[dow] = gross;
      if (date) dateByWeekday[dow] = date;
    }
  });

  snapshot.friday = firstByWeekday[5] ?? null;
  snapshot.saturday = firstByWeekday[6] ?? null;
  snapshot.sunday = firstByWeekday[0] ?? null;
  if (dateByWeekday[5]) snapshot.dates.friday = dateByWeekday[5];
  if (dateByWeekday[6]) snapshot.dates.saturday = dateByWeekday[6];
  if (dateByWeekday[0]) snapshot.dates.sunday = dateByWeekday[0];

  return snapshot;
}

export async function fetchBoxOffice(url: string): Promise<BoxOfficeFetchResult> {
  const sourceUrl = absoluteUrl(url);
  try {
    const res = await tnFetch(sourceUrl);
    const httpStatus = res.status;
    if (!res.ok) {
      return {
        ok: false,
        httpStatus,
        snapshot: null,
        sourceUrl,
        errorMessage: `The Numbers request failed (${httpStatus})`,
      };
    }
    const html = await res.text();
    return {
      ok: true,
      httpStatus,
      snapshot: parseBoxOfficeHtml(html, sourceUrl),
      sourceUrl,
      errorMessage: null,
    };
  } catch (e) {
    return {
      ok: false,
      httpStatus: 0,
      snapshot: null,
      sourceUrl,
      errorMessage: (e as Error).message,
    };
  }
}

export function snapshotMetrics(
  snapshot: CanonicalBoxOfficeSnapshot
): Array<{ metric: BoxOfficeMetric; value: number; theatricalDate: string | null }> {
  const out: Array<{
    metric: BoxOfficeMetric;
    value: number;
    theatricalDate: string | null;
  }> = [];
  for (const metric of BOX_OFFICE_METRICS) {
    const value = snapshot[metric];
    if (typeof value === "number" && value > 0) {
      out.push({
        metric,
        value,
        theatricalDate: snapshot.dates[metric] ?? null,
      });
    }
  }
  return out;
}
