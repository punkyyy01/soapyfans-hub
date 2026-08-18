-- Post-Hardening-III adversarial review found that the films UPDATE policy
-- added to fix the broken review-upsert (using(true) with check(true), any
-- authenticated user) was broader than necessary: it lets any logged-in
-- user PATCH /rest/v1/films?tmdb_id=eq.<any> directly with arbitrary
-- title/poster_path/overview for an EXISTING, already-reviewed film.
-- Confirmed that corrupted values are NOT cosmetic-only -- they render on
-- the public profile activity feed of every user who reviewed that film
-- (app/(main)/profile/[username]/page.tsx selects films(title, poster_path,
-- tmdb_id) from the reviews join) and in the admin dashboard's review list.
--
-- The only legitimate writer is submitReview() in app/(auth)/actions.ts,
-- which now upserts via the service-role client (createAdminClient()) --
-- every field it writes comes from a real getMovieDetails(tmdbId) response,
-- never from client input, so that write path needs no RLS policy of its
-- own (service_role bypasses RLS). Dropping the client-facing policies
-- closes the direct-PostgREST tampering vector entirely; films remains
-- publicly readable.

begin;

drop policy if exists "Authenticated users can insert films" on public.films;
drop policy if exists "Authenticated users can update films" on public.films;

commit;
