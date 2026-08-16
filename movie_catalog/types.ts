export const MAX_TRACKED = 20;

export type MovieStatus =
  | "PRE_RELEASE"
  | "WEEKEND_LIVE"
  | "POST_OPENING"
  | "COMPLETED";

export interface Candidate {
  displayName: string;
  year: number | null;
  leadCast: string | null;
  director: string | null;
  thumbnail: string | null;
  url: string;
  slug: string;
}

export interface DomesticRelease {
  dateText: string;
  date: string | null;
  type: string;
  isReRelease: boolean;
  isCanceled: boolean;
  distributor: string | null;
}

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
  status: MovieStatus;
  is_active: boolean;
  last_checked_at: string | null;
  last_successful_check_at: string | null;
  last_canonical_change_at: string | null;
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
