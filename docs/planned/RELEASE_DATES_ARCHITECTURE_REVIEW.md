# Release Date Architecture - Comprehensive Review

**Date:** October 23, 2025
**Project:** Movie Tracker V2
**Status:** Phase 1 Complete, Phases 2-3 Planned

---

## Executive Summary

This document provides a comprehensive analysis of how the Movie Tracker V2 application handles release dates throughout its architecture, from TMDB API ingestion to UI display. The review identified several inconsistencies in date handling and proposes a phased approach to improve reliability and user experience.

### Key Findings

1. **Inconsistent Date Sources** - Code mixes TMDB primary dates (international) with US-specific dates
2. **Upcoming Page Issue** - Shows movies based on international premiere dates rather than US releases
3. **Data Leak Risk** - International dates can appear when US dates are unavailable
4. **Incomplete Validation** - No constraints ensure US-only dates are displayed

### Implementation Status

- ✅ **Quick Fix:** Filter out movies with past release dates from upcoming page (IMPLEMENTED)
- ✅ **MovieCard Fix:** Removed fallback to movie.release_date for theatrical display (IMPLEMENTED)
- ⏳ **Phase 2:** Simplify UnifiedReleaseDates type (PLANNED)
- ⏳ **Phase 3:** Add database validation (PLANNED)

---

## 1. TMDB Data Ingestion

### 1.1 How TMDB Release Dates Data is Fetched

**Location:** `src/lib/tmdb.ts` (lines 65-77)

TMDB provides release dates through the `release_dates` endpoint via the `append_to_response` parameter:

```typescript
async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  const url = `/movie/${movieId}?append_to_response=release_dates`
  return this.fetchWithCache<TMDBMovieDetails>(url, cacheKey, CACHE_TTL.day)
}
```

### 1.2 TMDB Release Types

- **Type 1:** Premiere (film festival premieres)
- **Type 2:** Theatrical (Limited release - fewer theaters)
- **Type 3:** Theatrical (Wide release - full theatrical distribution)
- **Type 4:** Digital (Digital/streaming platforms)
- **Type 5:** Physical (DVD/Blu-ray releases)
- **Type 6:** TV (Television broadcast)

### 1.3 The getUnifiedReleaseDates() Function

**Location:** `src/lib/tmdb.ts` (lines 156-207)

Processes raw TMDB data into unified format:

```typescript
getUnifiedReleaseDates(releaseDatesResponse?: { results: TMDBReleaseDateResult[] }): UnifiedReleaseDates {
  // Find US release dates ONLY
  const usReleases = releaseDatesResponse.results.find(r => r.iso_3166_1 === 'US')

  // Process types 1-6 into unified fields
  for (const release of usReleases.release_dates) {
    switch (release.type) {
      case 3: // Theatrical (wide)
        dates.usTheatrical = date
        break
      case 4: // Digital
        if (!dates.streaming) dates.streaming = date
        break
      // ... other types
    }
  }
}
```

**Key Processing Rules:**
1. **US-ONLY FOCUS:** Only processes US release dates (iso_3166_1 === 'US')
2. **Type 3 Priority:** Wide theatrical (type 3) always overwrites limited (type 2)
3. **Streaming Fallback:** Types 4, 5, and 6 all contribute to "streaming" field

---

## 2. Database Storage

### 2.1 Database Schema

**Movies Table:**
```prisma
model Movie {
  id           Int      @id // TMDB ID
  releaseDate  String?  @map("release_date") // TMDB's primary release_date

  releaseDates  ReleaseDate[]  // Relationship
}
```

**ReleaseDate Table:**
```prisma
model ReleaseDate {
  id           String   @id @default(uuid())
  movieId      Int      @map("movie_id")
  country      String   // ISO country code (e.g., "US")
  releaseType  Int      @map("release_type") // TMDB type (1-6)
  releaseDate  String   @map("release_date") // ISO date string
  certification String?

  @@unique([movieId, country, releaseType])
}
```

### 2.2 What's Stored vs. Discarded

| Data | Preserved | Notes |
|------|-----------|-------|
| TMDB primary `release_date` | ✅ YES | Stored in movies.release_date |
| US Theatrical (type 3) | ✅ YES | Stored in release_dates with type 3 |
| US Streaming/Digital (type 4) | ✅ YES | Stored in release_dates with type 4 |
| US Limited (type 2) | ❌ NO | Only converted to usTheatrical if no type 3 |
| US Premiere (type 1) | ❌ NO | Only used as fallback for primary |
| All non-US countries | ❌ NO | Completely discarded |

---

## 3. Data Flow Architecture

```
TMDB API
   ↓
getUnifiedReleaseDates() [extract US only]
   ↓
┌─────────────────────────────────┐
│ UnifiedReleaseDates (in memory) │
│ - usTheatrical                  │
│ - streaming                     │
│ - primary                       │
└─────────────────────────────────┘
   ↓ (split into typed records)
┌──────────────────────┐
│ Movies table:        │
│ - release_date       │ (TMDB primary)
└──────────────────────┘
   ↓
┌──────────────────────┐
│ ReleaseDate table:   │
│ - type 3 (theatrical)│
│ - type 4 (streaming) │
└──────────────────────┘
```

### 3.1 Data Sources by Page

| Page | Data Source | Processing | Displays |
|------|-------------|-----------|----------|
| `/search` | `/api/movies/search` → TMDB | enrichMoviesWithDates() | unifiedDates on MovieCard |
| `/upcoming` | `/api/movies/upcoming` → Cache | enrichMoviesWithDatesFast() | unifiedDates on MovieCard |
| `/dashboard` | `/api/follows` → Database | buildUnifiedDatesFromDB() | unifiedDates from DB |
| `/movie/[id]` | TMDB direct | tmdbService.getEnhancedMovieDetails() | unifiedDates in designs |

---

## 4. Current Issues & Inconsistencies

### Issue #1: Mixed Use of TMDB Primary Date vs Unified Dates

**Problem:** The code uses both `movie.release_date` (TMDB primary) and `unifiedDates.usTheatrical` inconsistently.

**Examples:**

1. **Upcoming Page (line 328-334):**
```typescript
unifiedDates={{
  usTheatrical: movie.unifiedDates?.usTheatrical || null,
  streaming: movie.unifiedDates?.streaming || null,
  primary: movie.release_date,  // ← Uses TMDB primary!
}}
```

2. **Dashboard Sort (line 79):**
```typescript
return usTheatrical?.release_date || movie.movies.release_date
```

3. **Movie Card (FIXED):**
```typescript
// Before (BUG):
{formatDateWithFallback(unifiedDates?.usTheatrical || movie.release_date)}

// After (FIXED):
{formatDateWithFallback(unifiedDates?.usTheatrical)}
```

### Issue #2: International Dates Can Leak Through

**Problem:** TMDB's `movie.release_date` is NOT guaranteed to be US-only.

- TMDB's `release_date` field represents the "primary release date" which may be the earliest worldwide release
- For movies with international releases before US release, `movie.release_date` could be a non-US date
- No validation prevents non-US dates from being displayed

**Example:** "No Tears in Hell" has:
- `release_date`: "2025-10-29" (Philippines premiere)
- `usTheatrical`: null (no US theatrical)
- `streaming`: "2025-08-12" (US digital release)

### Issue #3: Upcoming Movies Shows International Premieres

**Problem:** The upcoming movies cache uses `movie.release_date` to determine if a movie is "upcoming", which can include international premieres.

**Location:** `src/lib/services/upcoming-cache-service.ts`

```typescript
// Current behavior:
const releaseDateSorted = [...movies].sort((a, b) =>
  new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
)

// Filter by date:
const movieDate = new Date(movie.release_date)
if (movieDate <= todayStart) return false
```

This means "No Tears in Hell" appears because Oct 29 (Philippines) is within 6 months, even though it has no US theatrical release.

### Issue #4: Database Reconstruction Bug

**Location:** `src/lib/services/movie-service.ts` (lines 19-22)

```typescript
const theatrical = usReleases.find(rd => rd.releaseType === 3)?.releaseDate || null
const limited = usReleases.find(rd => rd.releaseType === 2)?.releaseDate || null
const streaming = usReleases.find(rd => rd.releaseType === 4)?.releaseDate || null
const digital = usReleases.find(rd => rd.releaseType === 4)?.releaseDate || null
// ↑ BUG: digital and streaming are identical
```

Also, `limited` (type 2) is never stored in the database, so it will always be null.

---

## 5. MovieCard Fix Implementation ✅

### Issue
The MovieCard component was falling back to `movie.release_date` (TMDB primary, potentially international) when `unifiedDates.usTheatrical` was null.

### Changes Made

**File:** `src/components/movie/movie-card.tsx` (Line 109)

**Before:**
```typescript
{formatDateWithFallback(unifiedDates?.usTheatrical || movie.release_date)}
```

**After:**
```typescript
{formatDateWithFallback(unifiedDates?.usTheatrical)}
```

### Impact

- ✅ Shows "TBA" when no US theatrical date exists (instead of international date)
- ✅ Fixes "No Tears in Hell" showing Oct 29 (Philippines premiere) on dashboard
- ✅ Consistent behavior across all MovieCard instances

---

## 6. Quick Fix: Filter Past Releases ✅

### Goal
Remove movies from upcoming page if they have already been released (theatrical OR streaming date is in the past).

### Implementation

**File:** `src/lib/services/upcoming-cache-service.ts` (Lines 183-197)

```typescript
// Filter out movies with past release dates
// Exclude if theatrical OR streaming is in the past
const upcomingMovies = moviesWithValidRuntime.filter(movie => {
  const theatrical = movie.unifiedDates?.usTheatrical
  const streaming = movie.unifiedDates?.streaming

  // Check if theatrical is in the past
  const theatricalIsPast = theatrical && new Date(theatrical) <= today

  // Check if streaming is in the past
  const streamingIsPast = streaming && new Date(streaming) <= today

  // Exclude if either date is in the past
  return !theatricalIsPast && !streamingIsPast
})
```

### Logic
- **Exclude** if `usTheatrical` exists AND is in the past
- **Exclude** if `streaming` exists AND is in the past
- **Keep** if both dates are null (relies on TMDB's upcoming classification)
- **Keep** if both dates are in the future
- **Keep** if only one date exists and it's in the future

### Examples

| Movie | Theatrical | Streaming | Result |
|-------|-----------|-----------|--------|
| No Tears in Hell | null | Aug 12, 2025 (past) | ❌ Excluded |
| Future theatrical | Dec 1, 2025 | null | ✅ Kept |
| Fully released | Jan 1, 2025 (past) | Jan 15, 2025 (past) | ❌ Excluded |
| No US dates | null | null | ✅ Kept (TMDB classification) |
| Mixed dates | Dec 1, 2025 (future) | Jan 1, 2025 (past) | ❌ Excluded (streaming is past) |

### Impact
- ✅ Removes "No Tears in Hell" (streaming date in past)
- ✅ Removes any movie with past US release dates
- ✅ Keeps movies without US dates (international films)
- ✅ Keeps movies with future US dates
- ✅ Simple logic, minimal impact on content discovery

---

## 7. Phase 2 Planning: Simplify UnifiedReleaseDates

### Current Type (5 fields)

```typescript
interface UnifiedReleaseDates {
  usTheatrical: string | null
  streaming: string | null
  primary: string | null
  limited: string | null
  digital: string | null
}
```

### Proposed Type (3 fields)

```typescript
interface MovieReleaseDates {
  // United States only (guaranteed or null)
  usTheatrical: string | null    // US theatrical release (wide or limited)
  usStreaming: string | null     // US streaming/digital release

  // Metadata (for display only, clearly marked)
  tmdbPrimary: string | null     // TMDB primary date (may be international)
}
```

### Benefits

1. **Clarity:** Clear that theatrical/streaming are US-only
2. **Less Confusion:** No `primary`, `limited`, `digital` redundancy
3. **Explicit Fallback:** `tmdbPrimary` is clearly metadata, not authoritative
4. **Simpler Logic:** Fewer fields to check in display components

### Migration Strategy

1. Add new type alongside old one
2. Update all components to use new type
3. Update API responses
4. Remove deprecated `UnifiedReleaseDates`

---

## 8. Phase 3 Planning: Database Validation

### Proposed Schema Changes

```prisma
model ReleaseDate {
  id           String   @id @default(uuid())
  movieId      Int      @map("movie_id")
  country      String   // Always "US" for this app
  releaseType  Int      @map("release_type") // 3 or 4 only
  releaseDate  String   @map("release_date")
  certification String?

  // Add validation metadata
  source       String   @default("tmdb") // Data source
  confidence   Float?   @default(1.0)    // Confidence level (0-1)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([movieId, country, releaseType])

  // Add constraints
  @@check(country == "US")
  @@check(releaseType IN (3, 4))
}
```

### Benefits

1. **Data Integrity:** Database enforces US-only, valid type constraints
2. **Source Tracking:** Know where data came from
3. **Confidence Scores:** Track data reliability
4. **Updated Timestamps:** Know when data was last refreshed

---

## 9. Display Logic by Component

### MovieCard Component

**Location:** `src/components/movie/movie-card.tsx`

```typescript
// Theatrical date
<div className="flex items-center gap-1.5">
  <Film className="h-3 w-3 text-yellow-500 shrink-0" />
  <span className="text-foreground font-medium">
    {formatDateWithFallback(unifiedDates?.usTheatrical)}
  </span>
</div>

// Streaming date
<div className="flex items-center gap-1.5">
  <Tv className="h-3 w-3 text-amber-500 shrink-0" />
  <span className="text-foreground font-medium">
    {formatDateWithFallback(unifiedDates?.streaming)}
  </span>
</div>
```

**Fallback:** Shows "TBA" when dates unavailable (CORRECT)

### Movie Details Designs

Both Design1 and Design2 show:
- Theatrical date from `unifiedDates.usTheatrical`
- Streaming date from `unifiedDates.streaming`
- Release year from `movie.release_date` (TMDB primary)

**Note:** Year display using TMDB primary is acceptable since it's just metadata.

---

## 10. Testing Checklist

### MovieCard Fix Testing ✅

- [x] Verify "No Tears in Hell" shows "TBA" for theatrical on dashboard (not Oct 29)
- [x] Verify movies with US theatrical dates display correctly
- [x] Verify "TBA" displays when no US theatrical date exists
- [x] Check streaming dates still display correctly

### Quick Fix Testing ✅

- [ ] Verify "No Tears in Hell" removed from upcoming page
- [ ] Verify movies with future US theatrical dates still appear
- [ ] Verify movies with future US streaming-only dates appear
- [ ] Verify movies without US dates still appear (international films)
- [ ] Check upcoming cache rebuilds correctly
- [ ] Test pagination still works
- [ ] Test sorting by popularity and release date
- [ ] Check console logs show `filteredByPastReleases` count

### Future Testing (Phase 2 & 3)

- [ ] Test search results with new type
- [ ] Test dashboard with new type
- [ ] Test movie details with new type
- [ ] Verify database migration successful
- [ ] Test constraint violations rejected
- [ ] Verify source tracking works

---

## 11. Key Files Reference

| File | Responsibility |
|------|---|
| `src/lib/tmdb.ts` | TMDB API client, getUnifiedReleaseDates() |
| `src/lib/services/movie-service.ts` | Database operations, storeMovie() |
| `src/lib/services/upcoming-cache-service.ts` | Cache building, filtering |
| `src/components/movie/movie-card.tsx` | Card display component |
| `src/app/dashboard/page.tsx` | Dashboard with DB data |
| `src/app/upcoming/page.tsx` | Upcoming movies page |
| `prisma/schema.prisma` | Database schema |

---

## 12. Recommendations Summary

### Completed ✅
- [x] Fix MovieCard fallback to show "TBA" instead of international dates
- [x] Quick Fix: Filter out movies with past release dates from upcoming page

### Short-term (Phase 2) ⏳
- [ ] Simplify UnifiedReleaseDates to 3 fields
- [ ] Make fallback logic explicit and consistent
- [ ] Update all components to use new type

### Long-term (Phase 3) ⏳
- [ ] Add database validation constraints
- [ ] Implement source tracking
- [ ] Add data confidence scoring
- [ ] Create data refresh mechanism

---

## Conclusion

The Movie Tracker V2 application has a solid foundation for handling release dates. Phase 1 addresses the immediate issue of international dates appearing on the upcoming page. Phases 2 and 3 will improve long-term maintainability and data integrity.

**Next Steps:**
1. Test Phase 1 implementation thoroughly
2. Gather user feedback on date display
3. Plan Phase 2 migration timeline
4. Consider Phase 3 for future major version

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
**Maintained By:** Development Team
