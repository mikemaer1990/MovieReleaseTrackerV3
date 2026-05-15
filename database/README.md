# Database Documentation

This folder contains database-related scripts and documentation for the Movie Tracker V2 project.

## Files

### Row Level Security (RLS)

- **`enable-rls.sql`** - Script to enable RLS on `movies` and `release_dates` tables
  - Status: ✅ Already applied to production
  - Fixes Supabase security warnings about RLS policies without RLS enabled

- **`rollback-rls.sql`** - Rollback script to disable RLS if needed
  - Use only if RLS causes issues (should not be necessary)

- **`RLS_TESTING_CHECKLIST.md`** - Testing checklist for RLS changes
  - Complete guide for testing RLS functionality
  - Useful reference for future table additions

### Data API Grants

- **`explicit-grants.sql`** - Explicit SELECT grants for the Supabase Data API
  - Status: ✅ Already applied to production
  - Context: Supabase is revoking auto-grants on all existing projects on Oct 30, 2026 (see https://github.com/orgs/supabase/discussions/45329)
  - Grants SELECT on `movies` and `release_dates` to `anon` and `authenticated` roles so read access survives after revocation
  - All other tables are accessed via `createSupabaseAdmin()` (service_role) and need no explicit grants

## Database Schema

The main database schema is managed through Prisma:
- Schema definition: `../prisma/schema.prisma`
- Migrations: `../prisma/migrations/`

## Current RLS Status

### Tables with RLS Enabled:
- ✅ `movies` - Everyone can SELECT (read-only public access)
- ✅ `release_dates` - Everyone can SELECT (read-only public access)
- ✅ `follows` - Users can view/insert/delete own follows
- ✅ `notifications` - Users can view own notifications
- ✅ `users` - Users can view/update own profile
- ✅ `password_reset_tokens` - RLS enabled, no policies = deny-all via Data API (service_role only)

### Important Notes:
- All write operations to `movies` and `release_dates` use `createSupabaseAdmin()` which bypasses RLS
- Anonymous users can browse movies (search, upcoming, popular)
- Authenticated users have full CRUD on their own follows
- `password_reset_tokens` has no Data API exposure by design — deny-all RLS with no policies is intentional
