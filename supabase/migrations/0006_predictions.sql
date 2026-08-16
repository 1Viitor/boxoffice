-- AI-assisted opening weekend predictions (append-only history).

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete restrict,
  created_at timestamptz not null default now(),
  mode text not null,
  target_metric text not null default 'opening_weekend',
  point_estimate numeric not null,
  low numeric,
  high numeric,
  confidence text,
  rationale text,
  signals jsonb,
  citations jsonb,
  canonical_snapshot jsonb,
  model_version text
);

create index if not exists predictions_movie_id_idx
  on public.predictions (movie_id, created_at desc);

alter table public.predictions enable row level security;

drop policy if exists "predictions_all_access" on public.predictions;
create policy "predictions_all_access" on public.predictions
  for all to anon, authenticated using (true) with check (true);
