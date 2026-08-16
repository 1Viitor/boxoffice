-- Store the theatrical calendar day (from The Numbers chart hrefs) per observation.

alter table public.canonical_observations
  add column if not exists theatrical_date date;
