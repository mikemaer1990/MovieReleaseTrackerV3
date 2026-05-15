-- Explicit Data API grants for Supabase breaking change
-- Context: https://github.com/orgs/supabase/discussions/45329
--
-- Supabase is revoking auto-grants on public schema tables.
-- Timeline: Oct 30, 2026 — existing projects are affected.
--
-- Run this in the Supabase SQL Editor before that date.
-- Safe to run multiple times (GRANT is idempotent).
--
-- Access audit:
--   movies              — anon client used in movie-service.ts (getMovie, movieExists)
--   follows             — service_role only (no anon/authenticated grant needed)
--   release_dates       — service_role only
--   notifications       — service_role only
--   users               — service_role only
--   password_reset_tokens — service_role only

-- movies: public read-only data, accessed via the anon Supabase client
GRANT SELECT ON public.movies TO anon;
GRANT SELECT ON public.movies TO authenticated;

-- release_dates: joined with movies in movie-service.ts (also via anon client)
GRANT SELECT ON public.release_dates TO anon;
GRANT SELECT ON public.release_dates TO authenticated;

-- Verify grants were applied
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('movies', 'release_dates', 'follows', 'notifications', 'users', 'password_reset_tokens')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
