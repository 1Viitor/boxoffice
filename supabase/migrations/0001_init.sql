-- Boxoffice initial schema
-- Run this in the Supabase SQL editor (or via the Supabase MCP / CLI).

-- Canonical tracked movie (identified by its The Numbers slug)
create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  the_numbers_slug text unique not null,
  the_numbers_url text not null,
  title text not null,
  year integer,
  thumbnail_url text,
  status text not null default 'tracked'
    check (status in ('candidate', 'eligible', 'tracked', 'ineligible')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Domestic releases parsed from The Numbers (a movie may have several, e.g. Wide + IMAX)
create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  country text not null default 'domestic',
  release_date date,
  release_date_text text,
  release_type text,
  is_re_release boolean not null default false,
  distributor text,
  source_url text,
  created_at timestamptz not null default now()
);

create index if not exists releases_movie_id_idx on public.releases (movie_id);

-- Ingested release-schedule index (fast local search / validation fallback)
create table if not exists public.schedule_cache (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year integer,
  release_date date,
  release_date_text text,
  release_type text,
  is_re_release boolean not null default false,
  distributor text,
  slug text,
  url text,
  scraped_at timestamptz not null default now()
);

create index if not exists schedule_cache_title_idx on public.schedule_cache (lower(title));
create unique index if not exists schedule_cache_uniq on public.schedule_cache (title, coalesce(release_date_text, ''), coalesce(release_type, ''));

-- Row Level Security: enabled; policies in 0002_policies.sql allow the
-- server-side anon/publishable key to read and write tracker tables.
alter table public.movies enable row level security;
alter table public.releases enable row level security;
alter table public.schedule_cache enable row level security;
