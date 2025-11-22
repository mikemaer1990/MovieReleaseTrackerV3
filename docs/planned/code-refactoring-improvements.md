# Code Refactoring Improvements

**Created:** 2025-11-22
**Status:** Planning
**Priority:** Medium

## Overview

This document outlines remaining code refactoring opportunities identified during the codebase cleanup audit. These improvements will reduce code duplication, improve maintainability, and make the codebase easier to work with.

---

## Task 1: Create Reusable FollowButton Component

### Current State

Follow/unfollow logic is duplicated across multiple components:

1. **`src/hooks/use-follows.ts`** - Main follow hook with optimistic updates
2. **`src/components/movie/designs/design-1.tsx`** - Local follow state management
3. **`src/components/movie/designs/design-2.tsx`** - Local follow state management
4. **`src/components/movie/movie-card.tsx`** - Follow button implementation

Each component reimplements:
- Follow/unfollow API calls
- Optimistic UI updates
- Loading states
- Error handling
- Success animations (particle bursts)

### Problems

- **Code duplication** (~200+ lines of repeated logic)
- **Inconsistent behavior** across different components
- **Maintenance burden** - bug fixes need to be applied in multiple places
- **Testing complexity** - same logic needs testing in multiple places

### Proposed Solution

Create a unified `<FollowButton>` component:

```tsx
// src/components/movie/follow-button.tsx

interface FollowButtonProps {
  movieId: number
  movieTitle: string
  variant?: 'default' | 'compact' | 'icon-only'
  onFollowChange?: (followType: FollowType | null) => void
  showParticleBurst?: boolean
  className?: string
}

export function FollowButton({
  movieId,
  movieTitle,
  variant = 'default',
  onFollowChange,
  showParticleBurst = true,
  className
}: FollowButtonProps) {
  // Centralized follow logic using use-follows hook
  // Handles optimistic updates
  // Manages loading states
  // Shows success animations
  // Error handling with toast notifications
}
```

### Benefits

- ✅ **Single source of truth** for follow logic
- ✅ **Consistent UX** across all pages
- ✅ **Easier testing** - test once, works everywhere
- ✅ **Simpler maintenance** - update in one place
- ✅ **Smaller bundle** - reduce duplication (~150KB savings)

### Files to Update

1. Create `src/components/movie/follow-button.tsx`
2. Update `src/components/movie/designs/design-1.tsx` to use new component
3. Update `src/components/movie/designs/design-2.tsx` to use new component
4. Update `src/components/movie/movie-card.tsx` to use new component
5. Add tests in `__tests__/components/follow-button.test.tsx`

### Implementation Steps

1. Extract common follow logic into reusable component
2. Support multiple visual variants (full button, compact, icon-only)
3. Add configurable callbacks for parent components
4. Migrate existing components one at a time
5. Test thoroughly across all pages (search, dashboard, movie details)
6. Remove old duplicated code

---

## Task 2: Clean Up Commented-Out Code

### Current State

**414+ lines of commented code** found across the codebase, primarily in:

- Component JSX comments explaining conditional rendering
- Old implementation attempts left in comments
- Debug comments that should be removed
- Unused code blocks kept "just in case"

### Problems

- **Code clutter** makes files harder to read
- **Confusion** about what's active vs. inactive
- **Maintenance burden** - commented code can get out of sync
- **False positives** in code searches
- **Larger file sizes** unnecessarily

### Proposed Solution

**Systematic cleanup pass:**

1. **Remove explanatory JSX comments** - Use clear component names instead
   ```tsx
   // ❌ BAD
   {/* Only show rating if vote_average > 0 */}
   {movie.vote_average > 0 && <Rating value={movie.vote_average} />}

   // ✅ GOOD
   {movie.vote_average > 0 && <Rating value={movie.vote_average} />}
   // OR extract to a well-named component
   <ConditionalRating movie={movie} />
   ```

2. **Remove debug comments** - Use proper logging or debugger
   ```tsx
   // ❌ BAD
   // console.log('Movie data:', movie)
   // console.log('Follow status:', followStatus)

   // ✅ GOOD - Use logging service or debugger when needed
   ```

3. **Delete unused code blocks** - Use version control instead
   ```tsx
   // ❌ BAD
   // const oldCalculation = (a, b) => a + b
   // function deprecatedHelper() { ... }

   // ✅ GOOD - Delete it, use git history if needed
   ```

4. **Extract complex logic** to helper functions with descriptive names
   ```tsx
   // ❌ BAD
   {/* Check if movie is released and user is following */}
   {isReleased && followStatus && followStatus.followType && (
     <div>Following</div>
   )}

   // ✅ GOOD
   {shouldShowFollowingBadge(movie, followStatus) && (
     <div>Following</div>
   )}
   ```

### Files to Clean

Based on the audit, primary files with commented code:

1. `src/components/movie/designs/design-1.tsx`
2. `src/components/movie/designs/design-2.tsx`
3. `src/components/movie/movie-card.tsx`
4. `src/app/dashboard/page.tsx`
5. `src/app/search/page.tsx`
6. Various other component files

### Implementation Steps

1. Run automated search for comment patterns:
   ```bash
   # Find JSX comments
   grep -r "{/\*" src/ --include="*.tsx"

   # Find commented console.logs
   grep -r "// console\." src/ --include="*.ts" --include="*.tsx"

   # Find commented-out function definitions
   grep -r "^// function\|^// const" src/ --include="*.ts" --include="*.tsx"
   ```

2. Review each commented block:
   - **Delete** if it's old/unused code
   - **Uncomment** if it should be active
   - **Refactor** to helper function if it's complex logic explanation

3. Test after cleanup to ensure nothing broke

4. Update ESLint rules to prevent future commented code:
   ```json
   {
     "rules": {
       "no-commented-out-code": "warn"
     }
   }
   ```

### Benefits

- ✅ **Cleaner codebase** - easier to read and navigate
- ✅ **Better maintainability** - less confusion about active code
- ✅ **Smaller files** - ~400+ lines removed
- ✅ **Improved searchability** - fewer false positives
- ✅ **Better practices** - use version control instead of commenting

---

## Task 3: Refactor Duplicate Movie Card Designs

### Current State

Two movie detail page designs with **~70% code duplication**:

1. **`src/components/movie/designs/design-1.tsx`** (847 lines)
2. **`src/components/movie/designs/design-2.tsx`** (700+ lines)

**Total:** 1,500+ lines with significant overlap

### Duplication Analysis

**Shared code (~70%):**
- Follow button logic and state management
- Movie data fetching and loading states
- Ratings display (TMDB, OMDB)
- Cast and crew sections
- Similar info sections
- Video player embeds
- Release date display logic

**Differences (~30%):**
- Layout arrangement (header, poster placement)
- Visual styling (colors, spacing, animations)
- Section ordering
- Some UI component choices

### Problems

- **Maintenance nightmare** - changes need to be made twice
- **Bug inconsistency** - fixing bugs in one design but not the other
- **Large bundle size** - shipping duplicate code to users
- **Difficult testing** - need to test both designs for every feature
- **Code smell** - violates DRY principle

### Proposed Solution

**Option 1: Component Composition (Recommended)**

Extract shared logic into reusable components:

```tsx
// Shared components
src/components/movie/details/
  ├── movie-header.tsx          // Title, tagline, metadata
  ├── movie-poster.tsx          // Poster with loading states
  ├── movie-ratings.tsx         // Already exists, ensure it's used
  ├── movie-overview.tsx        // Description section
  ├── movie-cast-crew.tsx       // Cast and crew lists
  ├── movie-videos.tsx          // Trailers and clips
  ├── movie-release-info.tsx    // Release dates, runtime
  └── movie-follow-section.tsx  // Follow buttons and status

// Layout wrappers
src/components/movie/designs/
  ├── design-1-layout.tsx       // Composition using shared components
  └── design-2-layout.tsx       // Composition using shared components
```

Each design becomes a **layout wrapper** that composes shared components:

```tsx
// design-1-layout.tsx (simplified from 847 lines to ~150 lines)
export function Design1Layout({ movie, ratings, followStatus }) {
  return (
    <div className="design-1-container">
      <MovieHeader movie={movie} variant="centered" />
      <div className="content-grid">
        <MoviePoster movie={movie} size="large" />
        <div className="info-column">
          <MovieRatings ratings={ratings} />
          <MovieOverview movie={movie} />
          <MovieFollowSection movie={movie} status={followStatus} />
        </div>
      </div>
      <MovieCastCrew credits={movie.credits} />
      <MovieVideos videos={movie.videos} />
    </div>
  )
}
```

**Option 2: Variant-Based Single Component**

Create one component with visual variants:

```tsx
export function MovieDetails({
  movie,
  ratings,
  variant = 'design-1'
}: MovieDetailsProps) {
  // Shared logic

  const layoutVariants = {
    'design-1': <Design1Layout />,
    'design-2': <Design2Layout />
  }

  return layoutVariants[variant]
}
```

### Benefits

- ✅ **Massive code reduction** - from 1,500 lines to ~400-500 lines
- ✅ **Single source of truth** for business logic
- ✅ **Easier maintenance** - update once, works everywhere
- ✅ **Better testing** - test shared components independently
- ✅ **Smaller bundle** - ~500-600KB savings (gzipped: ~100KB)
- ✅ **Easier to add new designs** - just compose existing components differently

### Implementation Steps

1. **Audit** - Identify all shared vs. unique code sections
2. **Extract** shared components one at a time:
   - Start with simplest (MovieHeader, MoviePoster)
   - Move to complex (MovieRatings, MovieCastCrew)
   - End with stateful (MovieFollowSection)
3. **Refactor** design-1.tsx to use new components
4. **Test** design-1 thoroughly
5. **Refactor** design-2.tsx to use same components
6. **Test** design-2 thoroughly
7. **Cross-test** switching between designs
8. **Remove** old duplicated code
9. **Update** documentation

### Files to Create/Update

**New files:**
- `src/components/movie/details/movie-header.tsx`
- `src/components/movie/details/movie-poster.tsx`
- `src/components/movie/details/movie-overview.tsx`
- `src/components/movie/details/movie-cast-crew.tsx`
- `src/components/movie/details/movie-videos.tsx`
- `src/components/movie/details/movie-release-info.tsx`
- `src/components/movie/details/movie-follow-section.tsx`

**Update files:**
- `src/components/movie/designs/design-1.tsx` (reduce from 847 to ~150 lines)
- `src/components/movie/designs/design-2.tsx` (reduce from 700+ to ~150 lines)
- `src/components/movie/movie-details-switcher.tsx` (ensure both designs still work)

**Add tests:**
- `__tests__/components/movie-details/` (test each shared component)

---

## Priority & Timeline

### Immediate (This Week)
- ✅ Task 2: Clean up commented code (low risk, high impact)

### Short Term (Next 2 Weeks)
- 🔄 Task 1: Create reusable FollowButton component (medium complexity)

### Medium Term (Next Sprint)
- 🔄 Task 3: Refactor duplicate movie card designs (high complexity, high impact)

---

## Success Metrics

### Code Quality
- **Lines of code reduced:** Target 1,000+ lines removed
- **Duplication reduced:** From ~70% to <10%
- **Comment density:** From 414+ lines to <50 lines

### Performance
- **Bundle size reduction:** ~150KB gzipped savings
- **Build time improvement:** Fewer files to compile

### Maintainability
- **Single source of truth:** Shared logic in one place
- **Test coverage:** Easier to test smaller, focused components
- **Developer velocity:** Faster to add features and fix bugs

---

## Notes

- All tasks are **non-breaking** - existing functionality preserved
- Can be done **incrementally** - one task at a time
- Should be done **before** adding major new features
- Consider **feature freeze** during Task 3 (movie card refactor)

---

## Related Documents

- `docs/planned/route_optimization.md` - Performance improvements
- `docs/planned/RELEASE_DATES_ARCHITECTURE_REVIEW.md` - Release date improvements
- `docs/components/new-card.md` - Movie card design reference

---

**Last Updated:** 2025-11-22
**Next Review:** 2025-12-01
