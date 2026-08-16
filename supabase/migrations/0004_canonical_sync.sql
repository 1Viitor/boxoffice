-- Automatic canonical sync: checks vs observations, movie timestamps.

alter table public.movies
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_successful_check_at timestamptz,
  add column if not exists last_canonical_change_at timestamptz;

create table if not exists public.canonical_checks (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete restrict,
  checked_at timestamptz not null default now(),
  success boolean not null,
  http_status integer,
  error_message text
);

create index if not exists canonical_checks_movie_id_idx
  on public.canonical_checks (movie_id, checked_at desc);

alter table public.canonical_observations
  add column if not exists previous_value numeric,
  add column if not exists absolute_change numeric,
  add column if not exists percentage_change numeric,
  add column if not exists source_url text;

alter table public.canonical_checks enable row level security;

drop policy if exists "canonical_checks_all_access" on public.canonical_checks;
create policy "canonical_checks_all_access" on public.canonical_checks
  for all to anon, authenticated using (true) with check (true);
