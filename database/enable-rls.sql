-- Enable RLS on movies and release_dates tables
-- This fixes the Supabase security warnings

-- Enable RLS on movies table
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on release_dates table
ALTER TABLE release_dates ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('movies', 'release_dates');
