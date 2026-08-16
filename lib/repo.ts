import { getSupabaseAdmin } from "./db";
import type { DetailResult } from "./the-numbers/detail";
import { fetchReleaseSchedule } from "./the-numbers/schedule";
import { slugFromUrl } from "./the-numbers/parse";
import type { Candidate, TrackedMovie } from "./types";

export async function getTrackedMovies(): Promise<TrackedMovie[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];
  const { data, error } = await db
    .from("movies")
    .select("*, releases(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as TrackedMovie[]) ?? [];
}

export async function getMovieById(id: string): Promise<TrackedMovie | null> {
  const db = getSupabaseAdmin();
  if (!db) return null;
  const { data, error } = await db
    .from("movies")
    .select("*, releases(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TrackedMovie) ?? null;
}

/** Upsert a movie (by slug) plus its domestic releases. Returns the movie id. */
export async function trackMovie(
  detail: DetailResult,
  thumbnail: string | null
): Promise<string> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Database is not configured.");

  const { data: movie, error } = await db
    .from("movies")
    .upsert(
      {
        the_numbers_slug: detail.slug,
        the_numbers_url: detail.url,
        title: detail.title,
        year: detail.year,
        thumbnail_url: thumbnail ?? detail.thumbnail ?? null,
        status: "tracked",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "the_numbers_slug" }
    )
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  const movieId = movie!.id as string;

  // Replace releases so re-tracking reflects the latest data.
  await db.from("releases").delete().eq("movie_id", movieId);
  if (detail.domesticReleases.length) {
    const rows = detail.domesticReleases.map((r) => ({
      movie_id: movieId,
      country: "domestic",
      release_date: r.date,
      release_date_text: r.dateText,
      release_type: r.type,
      is_re_release: r.isReRelease,
      distributor: r.distributor,
      source_url: detail.url,
    }));
    const { error: relErr } = await db.from("releases").insert(rows);
    if (relErr) throw new Error(relErr.message);
  }

  return movieId;
}

export async function deleteMovie(id: string): Promise<void> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Database is not configured.");
  const { error } = await db.from("movies").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Refresh the release-schedule cache table. Returns number of rows written. */
export async function ingestSchedule(): Promise<number> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Database is not configured.");
  const entries = await fetchReleaseSchedule();
  if (!entries.length) return 0;

  const rows = entries.map((e) => ({
    title: e.title,
    year: e.year,
    release_date: e.date,
    release_date_text: e.releaseDateText,
    release_type: e.releaseType,
    is_re_release: e.isReRelease,
    distributor: e.distributor,
    slug: e.slug,
    url: e.url,
    scraped_at: new Date().toISOString(),
  }));

  const { error } = await db
    .from("schedule_cache")
    .upsert(rows, {
      onConflict: "title,release_date_text,release_type",
      ignoreDuplicates: false,
    });
  if (error) throw new Error(error.message);
  return rows.length;
}

/** Fallback title search over the ingested schedule cache. */
export async function searchScheduleCache(
  query: string,
  limit = 10
): Promise<Candidate[]> {
  const db = getSupabaseAdmin();
  const q = query.trim();
  if (!db || !q) return [];
  const { data, error } = await db
    .from("schedule_cache")
    .select("title, year, url, slug")
    .ilike("title", `%${q}%`)
    .not("url", "is", null)
    .limit(limit);
  if (error) throw new Error(error.message);

  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const row of (data as Array<{
    title: string;
    year: number | null;
    url: string | null;
    slug: string | null;
  }>) ?? []) {
    const key = row.slug || row.url || row.title;
    if (!row.url || seen.has(key)) continue;
    seen.add(key);
    out.push({
      displayName: row.title,
      year: row.year,
      leadCast: null,
      director: null,
      thumbnail: null,
      url: row.url,
      slug: row.slug || slugFromUrl(row.url),
    });
  }
  return out;
}
