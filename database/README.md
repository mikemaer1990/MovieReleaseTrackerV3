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

## Database Schema

The main database schema is managed through Prisma:
- Schema definition: `../prisma/schema.prisma`
- Migrations: `../prisma/migrations/`

## Current RLS Status

### Tables with RLS Enabled:
- ✅ `users` - Users can view/update own profile
- ✅ `follows` - Users can view/insert/delete own follows
- ✅ `notifications` - Users can view own notifications
- ✅ `movies` - Everyone can SELECT (read-only public access)
- ✅ `release_dates` - Everyone can SELECT (read-only public access)

### Important Notes:
- All write operations to `movies` and `release_dates` use `createSupabaseAdmin()` which bypasses RLS
- Anonymous users can browse movies (search, upcoming, popular)
- Authenticated users have full CRUD on their own follows
