# Issue: Stale Movie Data Persists After Unfollow/Refollow

## Problem

When a user unfollows and then refollows a movie, **the movie data is not refreshed from TMDB**. The app continues to use stale data that may be outdated or incorrect.

## Example Case: Wicked: For Good

1. User follows "Wicked: For Good" on Nov 18
2. At that time, TMDB had bad data showing Nov 17 as a Type 4 (Streaming) release
3. Movie and release dates get stored in database
4. User unfollows the movie
5. TMDB corrects their data (removes the bad Nov 17 Type 4 date)
6. User refollows the movie
7. **App still shows the old Nov 17 streaming date** because it uses cached database data

## Root Cause

**Location:** `src/app/api/follows/route.ts:48-58`

```typescript
// Check if movie exists in our database, if not fetch and store it
const movieExists = await MovieService.movieExists(movieId)

if (!movieExists) {
  // Fetch movie details from TMDB
  const movieDetails = await tmdbService.getMovieDetails(movieId)
  const releaseDates = tmdbService.getUnifiedReleaseDates(movieDetails.release_dates)

  // Store movie in database
  await MovieService.storeMovie(movieDetails, releaseDates)
}
```

**The issue:**
- Movie data is only fetched from TMDB if the movie **doesn't exist** in the database
- Unfollowing a movie only deletes the **follow record**, not the **movie data**
- Refollowing uses the existing stale movie data without checking TMDB for updates

## Impact

- **Medium severity** - Affects accuracy of release dates
- Users see outdated information even after unfollowing/refollowing
- The cron jobs DO refresh data daily, but manual user actions don't
- Can lead to confusion when users expect fresh data after refollowing

## Potential Solutions

### Option A: Always Refresh on Follow (Simple but Slow)
```typescript
const movieExists = await MovieService.movieExists(movieId)

// Always fetch fresh data from TMDB
const movieDetails = await tmdbService.getMovieDetails(movieId)
const releaseDates = tmdbService.getUnifiedReleaseDates(movieDetails.release_dates)

if (!movieExists) {
  await MovieService.storeMovie(movieDetails, releaseDates)
} else {
  await MovieService.updateMovie(movieDetails, releaseDates)
}
```

**Pros:** Always fresh data
**Cons:** Slower follows, more TMDB API calls

---

### Option B: Refresh if Data is Stale (Recommended)
```typescript
const movie = await MovieService.getMovie(movieId)
const shouldRefresh = !movie || MovieService.isStale(movie.updated_at, 7) // 7 days

if (shouldRefresh) {
  const movieDetails = await tmdbService.getMovieDetails(movieId)
  const releaseDates = tmdbService.getUnifiedReleaseDates(movieDetails.release_dates)

  if (!movie) {
    await MovieService.storeMovie(movieDetails, releaseDates)
  } else {
    await MovieService.updateMovie(movieDetails, releaseDates)
  }
}
```

**Pros:** Balance of freshness and performance
**Cons:** Requires tracking `updated_at` field, some complexity

---

### Option C: Manual Refresh Button (User Control)
Add a "Refresh Data" button next to each movie card that explicitly fetches fresh TMDB data.

**Pros:** User control, no automatic overhead
**Cons:** Extra UI complexity, users must know to use it

---

### Option D: Delete Movie on Last Unfollow (Clean but Lossy)
When the last user unfollows a movie, delete the movie data entirely.

**Pros:** Clean, always fresh on refollow
**Cons:** Lose historical data, more database writes

## Recommended Approach

**Option B (Refresh if Stale)** is the best balance:

1. Add `updated_at` timestamp tracking to movies table
2. On follow, check if movie data is older than 7 days
3. If stale, fetch fresh data from TMDB and update
4. Cron jobs already handle daily updates for followed movies

This ensures:
- Fresh data on first follow
- Fresh data if refollowing after a week
- No unnecessary API calls for recent data
- Cron jobs keep actively-followed movies fresh

## Temporary Workaround

For now, if bad data gets into the database:
1. Use the test endpoint to check: `/api/test/movie-dates?movieId=X`
2. Manually delete bad release_dates records via Supabase or custom endpoint
3. Wait for cron jobs to refresh (runs daily)

## Related Files

- `src/app/api/follows/route.ts` - Follow/unfollow logic
- `src/lib/services/movie-service.ts` - Movie storage logic
- `src/lib/services/cron/discover-dates-service.ts` - Cron job that refreshes dates
- `src/lib/tmdb.ts` - TMDB API integration with caching

## Status

- ⚠️ **Known Issue** - Not blocking, but should be addressed
- 🔧 **Fix Priority:** Medium
- 📅 **Discovered:** November 22, 2025
- 👤 **Reported by:** User (Wicked: For Good case)
