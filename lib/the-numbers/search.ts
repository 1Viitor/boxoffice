import { tnFetch, BASE_URL, absoluteUrl } from "./client";
import { getSuggestToken, clearSuggestToken } from "./token";
import { slugFromUrl } from "./parse";
import type { Candidate } from "@/lib/types";

interface SuggestItem {
  display_name?: string;
  year?: number;
  lead_cast?: string;
  director?: string;
  thumbnail?: string;
  url?: string;
  odid?: string | number;
}

function toCandidate(item: SuggestItem): Candidate {
  const rawUrl = item.url || (item.odid != null ? `/movie/${item.odid}` : "");
  const url = absoluteUrl(rawUrl);
  const thumbnail = item.thumbnail ? absoluteUrl(item.thumbnail) : null;
  return {
    displayName: item.display_name ?? "",
    year: typeof item.year === "number" && item.year > 0 ? item.year : null,
    leadCast: item.lead_cast || null,
    director: item.director || null,
    thumbnail,
    url,
    slug: slugFromUrl(url),
  };
}

async function fetchSuggest(
  q: string,
  limit: number,
  allowRetry = true
): Promise<SuggestItem[]> {
  const token = await getSuggestToken();
  const params = new URLSearchParams({ q, limit: String(limit), t: token });
  const res = await tnFetch(`/api/search-suggest.php?${params.toString()}`, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${BASE_URL}/`,
    },
  });

  // A stale/invalid token tends to surface as 401/403 (or an empty body).
  if ((res.status === 401 || res.status === 403) && allowRetry) {
    clearSuggestToken();
    return fetchSuggest(q, limit, false);
  }
  if (!res.ok) {
    throw new Error(`search-suggest failed (${res.status})`);
  }

  const json = (await res.json().catch(() => null)) as unknown;
  if (Array.isArray(json)) return json as SuggestItem[];
  return [];
}

/** Search The Numbers by title. Returns up to `limit` candidates. */
export async function searchMovies(
  query: string,
  limit = 10
): Promise<Candidate[]> {
  const q = query.trim();
  if (!q) return [];
  const items = await fetchSuggest(q, limit);
  return items
    .map(toCandidate)
    .filter((c) => c.url && c.displayName);
}
