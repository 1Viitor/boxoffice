# Boxoffice

Track theatrical movie releases. Type a movie title, Boxoffice searches
[The Numbers](https://www.the-numbers.com), confirms it has a **domestic
theatrical release**, and lets you add eligible titles to a tracked library.

The flow:

1. **Search** — The Numbers `search-suggest` API (title, year, cast, poster).
2. **Validate** — scrape the movie page's `Domestic Releases` and check
   eligibility (Wide / Limited / IMAX / Expands Wide / Special Engagement,
   excluding canceled entries and pure re-releases).
3. **Track** — save eligible movies (with their poster) to Supabase.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- Supabase (Postgres) for persistence
- `cheerio` for server-side HTML parsing

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

Search and validation work without any configuration. Tracking requires
Supabase (below).

## Supabase MCP (Cursor)

The project includes `.cursor/mcp.json` scoped to this Supabase project:

```
https://mcp.supabase.com/mcp?project_ref=zltrankesrqkeobftmjy
```

In Cursor: **Settings → Tools & MCP → Supabase → Connect**. After auth, the
agent can apply migrations and inspect the database via MCP.

## Supabase setup

1. Create a Supabase project (or use an existing one).
2. Run the SQL in `supabase/migrations/` in order:
   - `0001_init.sql` — tables (`movies`, `releases`, `schedule_cache`) + RLS.
   - `0002_policies.sql` — RLS policies (only needed if you use the anon key).
3. Put the connection details in `.env.local`:

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon or publishable key>
```

The key is used server-side only. For stricter security, use
`SUPABASE_SERVICE_ROLE_KEY` instead (it bypasses RLS) and drop the policies
from `0002_policies.sql`.

## Environment variables

See `.env.example`. Summary:

- `SUPABASE_URL` — project URL.
- `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) — one key, server-side.
- `THE_NUMBERS_BASE_URL` — defaults to `https://www.the-numbers.com`.
- `SCRAPER_USER_AGENT` — browser-like UA for outbound requests.
- `SCRAPE_RATE_LIMIT_MS` — min delay between requests to The Numbers (default 800).

## API routes

- `GET  /api/search?q=` — candidate movies from The Numbers.
- `POST /api/validate` `{ url }` — domestic releases + eligibility.
- `POST /api/track` `{ url, thumbnail }` — save an eligible movie.
- `GET  /api/movies` — tracked movies.
- `GET|DELETE /api/movies/:id` — one movie / untrack.
- `POST /api/ingest` — refresh the release-schedule cache (search fallback).

## Deploying to Railway

1. Push this repo to GitHub.
2. In [Railway](https://railway.com), create a project and deploy from the GitHub repo (or use the linked Railway project).
3. Set these **service variables** in Railway:

```
SUPABASE_URL=https://zltrankesrqkeobftmjy.supabase.co
SUPABASE_ANON_KEY=<your publishable or anon key>
THE_NUMBERS_BASE_URL=https://www.the-numbers.com
SCRAPE_RATE_LIMIT_MS=800
```

4. Railway auto-detects Next.js via Railpack (`npm run build` / `npm start`). Config is in `railway.toml`.
5. Generate a public domain under **Settings → Networking** after the first deploy succeeds.

Do not commit `.env.local`. Secrets live only in Railway variables.

## Notes on data source

Data comes from The Numbers. Their Terms of Service reserve systematic
scraping to licensed OpusData customers, so this project is intended for
personal use. All scraping is isolated in `lib/the-numbers/*` and cached, so
swapping in the official OpusData API later is straightforward.
