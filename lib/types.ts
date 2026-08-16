// Shared types across the app.

/** A search result from The Numbers' search-suggest API. */
export interface Candidate {
  displayName: string;
  year: number | null;
  leadCast: string | null;
  director: string | null;
  thumbnail: string | null;
  /** Absolute The Numbers movie URL. */
  url: string;
  /** Slug parsed from the URL (e.g. "Barbie-(2023)"). */
  slug: string;
}

/** A single domestic release parsed from a movie detail page. */
export interface DomesticRelease {
  dateText: string;
  /** ISO yyyy-mm-dd, or null if the date could not be parsed. */
  date: string | null;
  /** Normalized type: Wide | Limited | IMAX | Expands Wide | Special Engagement | (other). */
  type: string;
  isReRelease: boolean;
  isCanceled: boolean;
  distributor: string | null;
}

/** Result returned to the UI after validating a candidate. */
export interface ValidationResult {
  url: string;
  slug: string;
  title: string;
  year: number | null;
  thumbnail: string | null;
  domesticReleases: DomesticRelease[];
  eligible: boolean;
  reason: string;
  primaryRelease: DomesticRelease | null;
}

export interface MovieRow {
  id: string;
  the_numbers_slug: string;
  the_numbers_url: string;
  title: string;
  year: number | null;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReleaseRow {
  id: string;
  movie_id: string;
  country: string;
  release_date: string | null;
  release_date_text: string | null;
  release_type: string | null;
  is_re_release: boolean;
  distributor: string | null;
  source_url: string | null;
}

export interface TrackedMovie extends MovieRow {
  releases: ReleaseRow[];
}
