# Movie Details Page - Remaining Improvements

This document tracks remaining optimization and improvement opportunities for the movie details page and related components.

## Completed ✅

### High Priority
- ✅ **useCallback optimizations** - All event handlers wrapped in useCallback to prevent unnecessary re-renders
- ✅ **useEffect dependencies** - All dependencies properly specified
- ✅ **React cache() for TMDB** - Deduplicate API calls between generateMetadata and page component
- ✅ **Lucide tree-shaking** - Already using named imports for optimal bundle size

### Medium Priority
- ✅ **Memory leak cleanup** - Added AbortController + isMounted flag to prevent memory leaks during slow OMDB fetches
- ✅ **Accessibility improvements** - Comprehensive aria-labels, aria-expanded, aria-pressed, aria-current, role attributes

## Remaining Improvements

### Medium Priority

#### 1. Complex Follow Toggle Logic Refactoring
**File:** `src/components/movie/movie-details-switcher.tsx:138-189`

**Current Issue:**
The `handleToggleFollow` function has deeply nested if/else statements that are hard to read and maintain. It handles the splitting of "BOTH" follow types into individual types.

**Proposed Refactoring:**
```typescript
const handleToggleFollow = useCallback(async (_movieId: number, followType: FollowType) => {
  const isFollowingBoth = followTypes.includes('BOTH')
  const isCurrentlyFollowing =
    followTypes.includes(followType) ||
    (isFollowingBoth && (followType === 'THEATRICAL' || followType === 'STREAMING'))

  try {
    if (isCurrentlyFollowing) {
      // Unfollowing: Need to handle BOTH splitting
      if (isFollowingBoth) {
        const remainingType = followType === 'THEATRICAL' ? 'STREAMING' : 'THEATRICAL'
        await unfollowMovie(movie.id, 'BOTH')
        await followMovie(movie.id, remainingType)
        setFollowTypes([remainingType])
      } else {
        // Simple unfollow
        await unfollowMovie(movie.id, followType)
        setFollowTypes(prev => prev.filter(t => t !== followType))
      }
    } else {
      // Following: Simple add
      await followMovie(movie.id, followType)
      setFollowTypes(prev => [...prev, followType])
    }
  } catch (error) {
    console.error('Error toggling follow:', error)
    loadFollowStatus()
  }
}, [followTypes, followMovie, unfollowMovie, movie.id, loadFollowStatus])
```

**Benefits:**
- Reduces nesting from 3-4 levels to 2 levels
- Eliminates duplicate logic between THEATRICAL and STREAMING branches
- More maintainable and easier to understand
- Same functionality, clearer code

**Effort:** Low (5-10 minutes)

---

#### 2. OMDB Caching Layer
**Files:** `src/lib/omdb.ts`, `src/lib/redis.ts`

**Current Issue:**
- OMDB API has 1000 calls/day limit on free tier
- No caching means duplicate calls for the same movie
- Slow response times (sometimes 40+ seconds) aren't cached

**Proposed Solution:**
1. Add cache key to `src/lib/redis.ts`:
   ```typescript
   omdbRatings: (imdbId: string) => `omdb:ratings:${imdbId}`
   ```

2. Modify `src/lib/omdb.ts` to check cache before API call:
   ```typescript
   async getRatingsByImdbId(imdbId: string): Promise<Partial<MovieRatings>> {
     // Check cache first
     const cached = await CacheService.get<Partial<MovieRatings>>(
       CACHE_KEYS.omdbRatings(imdbId)
     )
     if (cached) return cached

     // Fetch from API
     const omdbData = await this.getMovieByImdbId(imdbId)
     const ratings = this.parseRatings(omdbData, imdbId)

     // Cache for 7 days (ratings rarely change)
     await CacheService.set(
       CACHE_KEYS.omdbRatings(imdbId),
       ratings,
       CACHE_TTL.week
     )

     return ratings
   }
   ```

**Benefits:**
- Reduces API calls to OMDB (important for 1000/day limit)
- Eliminates 40-second hangs for cached movies
- Better user experience with instant ratings

**Considerations:**
- Ratings change slowly, so 7-day cache is safe
- Only helps after first view of a movie
- Already have progressive enhancement (server timeout + client fetch)

**Effort:** Low (10-15 minutes)

---

### Low Priority

#### 3. Replace console.log with Environment-Aware Logger
**Files:** Multiple files across the codebase

**Current Issue:**
Using `console.log`, `console.error` directly throughout the code. These run in production.

**Proposed Solution:**
Create `src/lib/logger.ts`:
```typescript
const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) console.log(...args)
  },
  error: (...args: unknown[]) => {
    console.error(...args) // Always log errors
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) console.warn(...args)
  },
  perf: (label: string, duration: number) => {
    if (isDevelopment) console.log(`[PERF] ${label} took ${duration}ms`)
  }
}
```

Replace all `console.log` with `logger.log`, etc.

**Benefits:**
- Cleaner production logs
- Better control over logging levels
- Easier to add analytics/error tracking later

**Effort:** Medium (30-45 minutes)

---

#### 4. Add Error Boundaries
**Files:** `src/app/movie/[id]/page.tsx`, `src/components/movie/movie-details-switcher.tsx`

**Current Issue:**
No error boundaries - errors crash the entire page.

**Proposed Solution:**
Create `src/components/error-boundary.tsx` and wrap components:
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <MovieDetailsSwitcher {...props} />
</ErrorBoundary>
```

**Benefits:**
- Graceful error handling
- Better user experience
- Easier debugging in production

**Effort:** Low (15-20 minutes)

---

#### 5. Add Loading States
**Files:** `src/components/movie/designs/design-1.tsx`, `src/components/movie/designs/design-2.tsx`

**Current Issue:**
Follow buttons don't show loading state during API calls.

**Proposed Solution:**
Already have `followLoading` state - just need to add visual indicators:
```typescript
<button disabled={followLoading}>
  {followLoading ? <Spinner /> : <Plus />}
  {followLoading ? 'Loading...' : 'Follow'}
</button>
```

**Benefits:**
- Better user feedback
- Prevents double-clicks
- More professional feel

**Effort:** Low (10 minutes)

---

#### 6. Extract Quality Movies Filter to Utility
**File:** `src/components/movie/designs/design-1.tsx:147-150`

**Current Issue:**
Quality filter logic (vote_average >= 5, vote_count >= 50) is inline.

**Proposed Solution:**
Only in one design currently, and you plan to delete one design. Skip unless you decide to keep both designs.

**Effort:** Very Low (5 minutes)

---

#### 7. Improve Similar Movies Section
**File:** `src/components/movie/designs/design-1.tsx`

**Current Issue:**
- Quality filter might exclude good movies with < 50 votes (indie films)
- Sorting only by vote_average doesn't account for popularity

**Proposed Solution:**
```typescript
const qualitySimilar = movie.similar?.results
  .filter(m =>
    m.vote_average >= 5 &&
    (m.vote_count >= 50 || m.popularity >= 10) // More lenient for popular movies
  )
  .sort((a, b) => {
    // Weighted score: 70% rating, 30% popularity
    const scoreA = (a.vote_average * 0.7) + (Math.min(a.popularity / 100, 10) * 0.3)
    const scoreB = (b.vote_average * 0.7) + (Math.min(b.popularity / 100, 10) * 0.3)
    return scoreB - scoreA
  })
  .slice(0, 6)
```

**Benefits:**
- Better recommendations
- Doesn't exclude quality indie films
- Balances rating and popularity

**Effort:** Very Low (5 minutes)

---

#### 8. Code Duplication Between Designs
**Files:** `src/components/movie/designs/design-1.tsx`, `src/components/movie/designs/design-2.tsx`

**Current Issue:**
- Combined rating calculation duplicated in both designs
- Quality filter logic duplicated
- Similar logic patterns throughout

**Proposed Solution:**
Extract shared logic to utilities:
- `src/lib/utils/rating-utils.ts` - Combined rating calculation
- `src/lib/utils/movie-filters.ts` - Quality filters

**Note:** You mentioned planning to delete one design, so this may not be necessary.

**Effort:** Medium (20-30 minutes)

---

## Future Enhancements (Nice to Have)

### 1. Keyboard Navigation
Add keyboard shortcuts for common actions:
- `Space` - Toggle follow
- `Escape` - Close design picker
- `Arrow keys` - Navigate between designs

### 2. Optimistic UI Updates
Update UI immediately before API call completes, rollback on error:
```typescript
setFollowTypes(prev => [...prev, followType]) // Optimistic
try {
  await followMovie(movie.id, followType)
} catch (error) {
  setFollowTypes(prev => prev.filter(t => t !== followType)) // Rollback
}
```

### 3. Animations
Add subtle animations:
- Follow button success animation
- Rating badge entrance
- Similar movies carousel

### 4. Social Sharing
Add share buttons for:
- Twitter
- Facebook
- Copy link

### 5. Watchlist Integration
Allow adding directly to streaming service watchlists (if APIs available)

---

## Summary

**Total Remaining Issues:** 8 (2 medium priority, 6 low priority)

**Quick Wins (< 15 minutes each):**
- Follow toggle refactoring
- OMDB caching
- Add loading states
- Similar movies sorting improvement

**Estimated Total Effort:** 2-3 hours for all remaining improvements

## Next Steps

1. Complete follow toggle refactoring (5-10 min)
2. Add OMDB caching layer (10-15 min)
3. Replace console.log with logger (30-45 min)
4. Add error boundaries (15-20 min)
5. Add loading state improvements (10 min)
6. Consider future enhancements based on user feedback
