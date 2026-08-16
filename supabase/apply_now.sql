-- Boxoffice: run this ONCE in the SQL editor for project zltrankesrqkeobftmjy
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.

-- 1) Movie status + keep-history flag
do $$
declare r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.movies'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.movies drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.movies
  add column if not exists is_active boolean not null default true;

update public.movies
  set status = 'PRE_RELEASE'
  where status not in ('PRE_RELEASE', 'WEEKEND_LIVE', 'POST_OPENING', 'COMPLETED');

alter table public.movies alter column status set default 'PRE_RELEASE';

alter table public.movies
  add constraint movies_status_check
  check (status in ('PRE_RELEASE', 'WEEKEND_LIVE', 'POST_OPENING', 'COMPLETED'));

-- 2) Forecasts, notes, canonical observations
create table if not exists public.forecasts (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete restrict,
  forecast_type text not null
    check (forecast_type in ('opening_weekend', 'end_of_month', 'end_of_year')),
  value numeric not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists forecasts_movie_id_idx on public.forecasts (movie_id, created_at desc);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists notes_movie_id_idx on public.notes (movie_id, created_at desc);

create table if not exists public.canonical_observations (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete restrict,
  metric text not null,
  value numeric not null,
  observed_at timestamptz not null default now(),
  is_final boolean not null default false
);
create index if not exists canonical_obs_movie_id_idx
  on public.canonical_observations (movie_id, observed_at desc);

alter table public.forecasts enable row level security;
alter table public.notes enable row level security;
alter table public.canonical_observations enable row level security;

drop policy if exists "forecasts_all_access" on public.forecasts;
create policy "forecasts_all_access" on public.forecasts
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "notes_all_access" on public.notes;
create policy "notes_all_access" on public.notes
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "canonical_observations_all_access" on public.canonical_observations;
create policy "canonical_observations_all_access" on public.canonical_observations
  for all to anon, authenticated using (true) with check (true);

-- 3) Automatic The Numbers sync
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
