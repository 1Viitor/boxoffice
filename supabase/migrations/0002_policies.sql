-- RLS policies for Boxoffice.
--
-- This is a personal, single-user tracker with no end-user auth. The app talks
-- to the database only from server-side code using a Supabase key kept out of
-- the browser. These policies let that key (anon/publishable) manage the
-- tracker tables.
--
-- For stricter production security, use the service_role key instead (it
-- bypasses RLS) and drop these policies.

create policy "movies_all_access"
  on public.movies for all
  to anon, authenticated
  using (true) with check (true);

create policy "releases_all_access"
  on public.releases for all
  to anon, authenticated
  using (true) with check (true);

create policy "schedule_cache_all_access"
  on public.schedule_cache for all
  to anon, authenticated
  using (true) with check (true);
