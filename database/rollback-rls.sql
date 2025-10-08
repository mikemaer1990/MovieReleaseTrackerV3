-- ROLLBACK SCRIPT - Disable RLS if something breaks
-- Use this if you encounter issues after enabling RLS

-- Disable RLS on movies table
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;

-- Disable RLS on release_dates table
ALTER TABLE release_dates DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('movies', 'release_dates');
