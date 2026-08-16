import * as cheerio from "cheerio";
import { tnFetchText, absoluteUrl } from "./client";
import {
  normalizeText,
  parseLongDate,
  parseReleaseType,
  slugFromUrl,
  yearFromSlug,
} from "./parse";
import type { DomesticRelease } from "@/movie_catalog/types";

export interface DetailResult {
  url: string;
  slug: string;
  title: string;
  year: number | null;
  thumbnail: string | null;
  domesticReleases: DomesticRelease[];
}

// Matches "July 21st, 2023 (Wide) by Warner Bros." repeated back-to-back.
const RELEASE_RE =
  /([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?,\s*\d{4})\s*\(([^)]+)\)\s*(?:by\s+(.+?))?(?=(?:[A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?,\s*\d{4}\s*\()|$)/g;

/** Parse the text of the "Domestic Releases:" cell into structured releases. */
export function parseDomesticReleases(cellText: string): DomesticRelease[] {
  const text = normalizeText(cellText);
  const out: DomesticRelease[] = [];
  let m: RegExpExecArray | null;
  RELEASE_RE.lastIndex = 0;
  while ((m = RELEASE_RE.exec(text)) !== null) {
    const dateText = m[1].trim();
    const parsed = parseReleaseType(m[2]);
    const distributor = m[3] ? normalizeText(m[3]) : null;
    out.push({
      dateText,
      date: parseLongDate(dateText),
      type: parsed.type,
      isReRelease: parsed.isReRelease,
      isCanceled: parsed.isCanceled,
      distributor,
    });
  }
  return out;
}

function extractTitle($: cheerio.CheerioAPI, slug: string): {
  title: string;
  year: number | null;
} {
  let raw =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    slug.replace(/-/g, " ");
  raw = normalizeText(raw);
  const ym = raw.match(/\((\d{4})\)/);
  const year = ym ? parseInt(ym[1], 10) : yearFromSlug(slug);
  const title = raw.replace(/\s*\((\d{4}).*?\)\s*$/, "").trim();
  return { title, year };
}

function extractThumbnail($: cheerio.CheerioAPI): string | null {
  const og = $('meta[property="og:image"]').attr("content");
  if (og && !/logo|thenumbers/i.test(og)) return absoluteUrl(og);
  // Some movie pages show a poster image inside the summary area.
  const img = $("#summary_mobile img, .movie_poster img, img#poster").first();
  const src = img.attr("src");
  return src ? absoluteUrl(src) : null;
}

/** Fetch and parse a movie detail page from The Numbers. */
export async function fetchMovieDetail(url: string): Promise<DetailResult> {
  const abs = absoluteUrl(url);
  const html = await tnFetchText(abs);
  const $ = cheerio.load(html);
  const slug = slugFromUrl(abs);
  const { title, year } = extractTitle($, slug);

  const collected: DomesticRelease[] = [];
  $("td, th").each((_i, el) => {
    const label = normalizeText($(el).text());
    if (/^Domestic Releases:?$/i.test(label)) {
      const valueCell = $(el).next();
      const cellText = valueCell.text();
      collected.push(...parseDomesticReleases(cellText));
    }
  });

  // The page renders the details block twice (desktop + mobile), so dedupe.
  const seen = new Set<string>();
  const domesticReleases = collected.filter((r) => {
    const key = `${r.date || r.dateText}|${r.type}|${r.distributor || ""}|${r.isReRelease}|${r.isCanceled}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    url: abs,
    slug,
    title,
    year,
    thumbnail: extractThumbnail($),
    domesticReleases,
  };
}
