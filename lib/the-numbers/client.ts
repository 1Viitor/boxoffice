// Low-level HTTP client for the-numbers.com with a browser-like User-Agent
// and a simple global rate limiter. All scraping goes through here.

export const BASE_URL =
  process.env.THE_NUMBERS_BASE_URL?.replace(/\/$/, "") ||
  "https://www.the-numbers.com";

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";

const USER_AGENT = process.env.SCRAPER_USER_AGENT || DEFAULT_UA;

function rateLimitMs(): number {
  const n = Number(process.env.SCRAPE_RATE_LIMIT_MS);
  return Number.isFinite(n) && n >= 0 ? n : 800;
}

// Serialize outbound requests so we never hammer the site.
let queue: Promise<void> = Promise.resolve();
let lastRequestAt = 0;

function schedule<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = Math.max(0, lastRequestAt + rateLimitMs() - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
  });
  // Keep the queue chain alive regardless of individual failures.
  queue = run.catch(() => {});
  return run.then(fn);
}

export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${BASE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export async function tnFetch(
  pathOrUrl: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = absoluteUrl(pathOrUrl);
  return schedule(() =>
    fetch(url, {
      ...init,
      redirect: "follow",
      cache: "no-store",
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        ...(init.headers || {}),
      },
    })
  );
}

export async function tnFetchText(pathOrUrl: string): Promise<string> {
  const res = await tnFetch(pathOrUrl);
  if (!res.ok) {
    throw new Error(
      `The Numbers request failed (${res.status}) for ${absoluteUrl(pathOrUrl)}`
    );
  }
  return res.text();
}
