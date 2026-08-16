import * as cheerio from "cheerio";
import { tnFetchText, absoluteUrl } from "./client";
import {
  normalizeText,
  parseMonthDay,
  slugFromUrl,
  splitTitleAndType,
} from "./parse";

export interface ScheduleEntry {
  title: string;
  year: number | null;
  releaseDateText: string | null;
  date: string | null;
  releaseType: string | null;
  isReRelease: boolean;
  isCanceled: boolean;
  distributor: string | null;
  url: string | null;
  slug: string | null;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function yearIn(text: string): number | null {
  const m = text.match(/\b(?:19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

/**
 * Parse The Numbers "North American Movie Release Schedule".
 * Handles month/section headers and carry-forward of the release date across rows.
 */
export async function fetchReleaseSchedule(
  path = "/movies/release-schedule"
): Promise<ScheduleEntry[]> {
  const html = await tnFetchText(path);
  const $ = cheerio.load(html);

  let table = $("table")
    .filter((_i, t) => /Release Date/i.test($(t).text()))
    .first();
  if (!table.length) table = $("table").first();

  const entries: ScheduleEntry[] = [];
  let currentYear: number | null = null;
  let currentDateText: string | null = null;

  table.find("tr").each((_i, tr) => {
    const cells = $(tr).children("td");
    if (cells.length < 2) return; // header (<th>) or spacer row

    const firstText = normalizeText($(cells[0]).text());
    const movieCell = $(cells[1]);
    const movieText = normalizeText(movieCell.text());
    const distributor =
      cells.length > 2 ? normalizeText($(cells[2]).text()) || null : null;

    // Section header rows have no movie.
    if (!movieText) {
      const y = yearIn(firstText);
      if (y) currentYear = y;
      currentDateText = null;
      return;
    }

    if (firstText) {
      currentDateText = firstText;
      const y = yearIn(firstText);
      if (y) currentYear = y;
    }

    const { title, typeInfo } = splitTitleAndType(movieText);
    if (!title) return;

    const href = movieCell.find("a[href*='/movie/']").first().attr("href") || null;
    const url = href ? absoluteUrl(href) : null;
    const slug = url ? slugFromUrl(url) : null;

    let date: string | null = null;
    let releaseDateText: string | null = currentDateText;
    const md = currentDateText ? parseMonthDay(currentDateText) : null;
    if (md && currentYear) {
      const d = new Date(Date.UTC(currentYear, md.month, md.day));
      if (!Number.isNaN(d.getTime())) {
        date = d.toISOString().slice(0, 10);
        releaseDateText = `${MONTH_NAMES[md.month]} ${md.day}, ${currentYear}`;
      }
    } else if (currentDateText && currentYear && !yearIn(currentDateText)) {
      releaseDateText = `${currentDateText} ${currentYear}`;
    }

    entries.push({
      title,
      year: currentYear,
      releaseDateText,
      date,
      releaseType: typeInfo?.type ?? null,
      isReRelease: typeInfo?.isReRelease ?? false,
      isCanceled: typeInfo?.isCanceled ?? false,
      distributor,
      url,
      slug,
    });
  });

  return entries;
}
