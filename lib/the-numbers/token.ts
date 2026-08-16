import { tnFetchText } from "./client";

// The search-suggest endpoint requires a per-page token exposed as
// `window.TN_SUGGEST_TOKEN = "..."` in the HTML of every page.
// We scrape it once and cache it for a while, refreshing on demand.

let cache: { token: string; at: number } | null = null;
const TTL_MS = 10 * 60 * 1000;

const TOKEN_RE = /TN_SUGGEST_TOKEN\s*=\s*["']([A-Za-z0-9]+)["']/;

export async function getSuggestToken(force = false): Promise<string> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) {
    return cache.token;
  }
  // Any page contains the token; the homepage is lightweight enough.
  const html = await tnFetchText("/");
  const m = html.match(TOKEN_RE);
  if (!m) {
    throw new Error("Could not locate TN_SUGGEST_TOKEN on The Numbers page.");
  }
  cache = { token: m[1], at: Date.now() };
  return cache.token;
}

export function clearSuggestToken(): void {
  cache = null;
}
