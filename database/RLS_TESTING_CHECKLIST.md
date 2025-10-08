# RLS Testing Checklist

## Pre-Deployment Checklist

### 1. Verify Existing Policies
- [ ] Open Supabase Dashboard → Database → Policies
- [ ] Check `movies` table has policy: "Movies are viewable by everyone"
- [ ] Check `release_dates` table has policy: "Release dates are viewable by everyone"
- [ ] Verify both policies use `FOR SELECT USING (true)`

### 2. Backup Current State
- [ ] Note current RLS status (should be disabled)
- [ ] Have rollback script ready: `rollback-rls.sql`

## Deployment Steps

### 3. Enable RLS
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy contents of `enable-rls.sql`
- [ ] Run the SQL script
- [ ] Verify output shows `rowsecurity = true` for both tables

### 4. Test Application Functionality

#### Anonymous User Tests (not signed in)
- [ ] Browse to homepage - should load without errors
- [ ] Navigate to `/search` - search should work
- [ ] Navigate to `/upcoming` - upcoming movies should display
- [ ] Click on a movie card - movie details should show
- [ ] Check browser console - no 401/403 errors

#### Authenticated User Tests (signed in)
- [ ] Sign in successfully
- [ ] Search for a movie
- [ ] Follow a movie (any type: THEATRICAL/STREAMING/BOTH)
- [ ] Navigate to `/dashboard` - followed movies should display
- [ ] Unfollow a movie - should work
- [ ] Check browser console - no RLS policy errors

#### API Endpoint Tests
- [ ] `GET /api/movies/popular` - returns data
- [ ] `GET /api/movies/upcoming` - returns data
- [ ] `GET /api/movies/search?q=test` - returns results
- [ ] `POST /api/follows` - creates follow successfully
- [ ] `GET /api/follows` - returns user's follows
- [ ] `DELETE /api/follows?movieId=X&followType=Y` - deletes follow

#### Background Service Tests (optional, requires manual trigger)
- [ ] Trigger `/api/cron/discover-dates` - completes without errors
- [ ] Trigger `/api/cron/daily-releases` - completes without errors
- [ ] Check Supabase logs for any RLS policy violations

## If Something Breaks

### Common Issues

**Issue:** "new row violates row-level security policy"
- **Cause:** Write operation blocked by RLS
- **Fix:** Verify using `createSupabaseAdmin()` for writes
- **Rollback:** Run `rollback-rls.sql`

**Issue:** Empty results when browsing movies
- **Cause:** SELECT policy not allowing reads
- **Fix:** Update policy to `USING (true)`
- **Rollback:** Run `rollback-rls.sql`

**Issue:** Follows not loading in dashboard
- **Cause:** JOIN query blocked by movie/release_dates policy
- **Fix:** Verify policies allow SELECT
- **Rollback:** Run `rollback-rls.sql`

### Rollback Process
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `rollback-rls.sql`
3. Run the SQL script
4. Verify application works again
5. Debug the policy issue before re-attempting

## Post-Deployment Verification

### 5. Verify Linter Warnings Resolved
- [ ] Open Supabase Dashboard → Database → Linter
- [ ] Confirm no more "Policy Exists RLS Disabled" errors
- [ ] Confirm no more "RLS Disabled in Public" errors
- [ ] All 4 previous security errors should be gone

### 6. Monitor for 24 Hours
- [ ] Check error logs in Supabase
- [ ] Monitor application for user reports
- [ ] Verify cron jobs run successfully
- [ ] No unexpected 401/403 errors

## Success Criteria

✅ All 4 Supabase linter errors resolved
✅ Anonymous users can browse movies
✅ Authenticated users can follow/unfollow movies
✅ Dashboard loads followed movies correctly
✅ Background jobs complete successfully
✅ No console errors or RLS violations
✅ Application performs normally

---

## Quick Reference

**Enable RLS:**
```sql
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_dates ENABLE ROW LEVEL SECURITY;
```

**Disable RLS (rollback):**
```sql
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE release_dates DISABLE ROW LEVEL SECURITY;
```

**Check RLS status:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('movies', 'release_dates');
```
