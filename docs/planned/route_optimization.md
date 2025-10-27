# Route Optimization Opportunities

## Overview
This document outlines performance optimization opportunities identified across the application's pages and API routes.

---

## 1. Dashboard Page (`src/app/dashboard/page.tsx`)

### Issue: Multiple Redundant API Calls
**Location:** Lines 109-113 & 134-137

**Problem:**
After follow/unfollow actions, `getUserFollows()` is called multiple times:
- Once after the action completes
- Again in error handling
- Total: 2-3 API calls per user action

**Current Code:**
```typescript
const handleFollow = async (movieId: number, followType: FollowType) => {
  try {
    await followMovie(movieId, followType)
    // First call
    const userFollows = await getUserFollows()
    setFollows(userFollows)
    setGroupedMovies(groupFollowsByMovie(userFollows))
    setStats(calculateStats(userFollows))
  } catch (error) {
    console.error('Error following movie:', error)
  }
}

const handleUnfollow = async (movieId: number, followType?: FollowType) => {
  // Optimistic update...
  try {
    await unfollowMovie(movieId, followType)
    // Second call
    const userFollows = await getUserFollows()
    // ...
  } catch (error) {
    // Third call in error handler
    const userFollows = await getUserFollows()
    // ...
  }
}
```

**Optimization:**
- Use optimistic updates (already partially implemented)
- Cache the response
- Only refresh on actual errors
- Reduce from 2-3 calls to 1 call per action

**Impact:** Medium - Reduces network requests, faster UI updates

---

## 2. Dashboard Page - Redundant State Recalculation

### Issue: Stats Recalculated on Every Render
**Location:** Lines 88-95

**Problem:**
`calculateStats()` runs every time `getUserFollows()` is called, even though the calculation is pure (same input = same output).

**Current Code:**
```typescript
const fetchFollows = async () => {
  try {
    const userFollows = await getUserFollows()
    setFollows(userFollows)
    const grouped = groupFollowsByMovie(userFollows)
    setGroupedMovies(grouped)
    setStats(calculateStats(userFollows)) // Recalculated every time
  } catch (error) {
    console.error('Error fetching follows:', error)
  }
}
```

**Optimization:**
Use `useMemo` to memoize the calculation:
```typescript
const stats = useMemo(() => calculateStats(follows), [follows])
const groupedMovies = useMemo(() => groupFollowsByMovie(follows), [follows])
```

**Impact:** Low-Medium - Prevents unnecessary computation on re-renders

---

## 3. Upcoming Page (`src/app/upcoming/page.tsx`)

### Issue: Inefficient Follow Checking (O(n²) complexity)
**Location:** Lines 210-219, used in line 369

**Problem:**
`getMovieFollowTypes()` is called for every movie in the grid (20+ movies), and each call iterates through all user follows:
- 20 movies × 50 follows = 1,000 iterations
- O(n²) time complexity

**Current Code:**
```typescript
const getMovieFollowTypes = (movieId: number): FollowType[] => {
  return userFollows
    .filter(f => f.movie_id === movieId)
    .map(f => f.follow_type)
}

// Called for every movie in render
{movies.map(movie => (
  <MovieCard
    followTypes={getMovieFollowTypes(movie.id)} // O(n) for each movie
  />
))}
```

**Optimization:**
Build a lookup Map once:
```typescript
const followMap = useMemo(() => {
  const map = new Map<number, FollowType[]>()
  userFollows.forEach(follow => {
    const existing = map.get(follow.movie_id) || []
    map.set(follow.movie_id, [...existing, follow.follow_type])
  })
  return map
}, [userFollows])

// Then use:
followTypes={followMap.get(movie.id) || []}
```

**Impact:** High - O(n²) → O(n), especially noticeable with many follows

---

## 4. Upcoming Page - Stats Recalculation

### Issue: Follow Stats Recalculated on Every Render
**Location:** Lines 129-151, useEffect at line 234

**Problem:**
`calculateFollowStats()` runs in a `useEffect` that depends on `movies` and `userFollows`, causing unnecessary recalculations.

**Current Code:**
```typescript
useEffect(() => {
  calculateFollowStats()
}, [movies, userFollows, isAuthenticated])
```

**Optimization:**
Use `useMemo` instead:
```typescript
const followStats = useMemo(() => {
  if (!isAuthenticated) return { totalFollowed: 0, ... }

  const followedMovieIds = new Set(userFollows.map(f => f.movie_id))
  // ... calculation
  return stats
}, [movies, userFollows, isAuthenticated])
```

**Impact:** Low-Medium - Cleaner code, prevents side effects

---

## 5. Search & Upcoming Pages - Duplicate Follow Fetching

### Issue: Multiple Pages Fetch Same User Follows
**Location:**
- `src/app/search/page.tsx` lines 58-78
- `src/app/upcoming/page.tsx` lines 108-126

**Problem:**
Both pages independently fetch and manage user follows:
- Duplicate API calls on navigation
- No shared cache between pages
- State reset on page change

**Optimization:**
Create a global follows context:
```typescript
// src/contexts/follows-context.tsx
export function FollowsProvider({ children }) {
  const [followMap, setFollowMap] = useState(new Map())

  // Fetch once, share everywhere
  // Automatic refresh on mutations

  return <FollowsContext.Provider value={{ followMap, refresh }}>
}
```

**Impact:** Medium - Reduces API calls, faster page transitions

---

## 6. API Routes - Multiple Supabase Client Creation

### Issue: Creating 2-3 Clients Per Request
**Location:** `src/app/api/follows/route.ts`
- Line 21: `const authClient = createSupabaseAdmin()`
- Line 61: `const dbClient = createSupabaseAdmin()` (in POST)
- Line 143: `const dbClient = createSupabaseAdmin()` (in GET)

**Problem:**
Each client creation initializes a new connection, causing overhead:
- Unnecessary memory allocation
- Potential connection pooling issues
- Slower response times

**Current Code (POST):**
```typescript
export async function POST(request: NextRequest) {
  const authClient = createSupabaseAdmin()
  // ... auth verification

  const dbClient = createSupabaseAdmin()
  // ... check existing follow

  // ... more operations with dbClient
}
```

**Optimization:**
Reuse a single client:
```typescript
export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdmin()

  // Use same client for auth AND database operations
  const { data: { user } } = await supabase.auth.getUser(token)
  // ... rest of operations
}
```

**Impact:** Low-Medium - Reduces memory overhead, cleaner code

---

## Priority Implementation Order

### High Priority
1. **Upcoming page follow lookup** (Issue #3)
   - Most impactful performance gain
   - O(n²) → O(n) complexity improvement
   - User-facing performance boost

### Medium Priority
2. **Dashboard stats memoization** (Issue #2)
   - Quick win, simple implementation
   - Prevents unnecessary re-renders

3. **Reduce duplicate API calls** (Issue #1)
   - Better UX, faster interactions
   - Cleaner error handling

4. **Global follows context** (Issue #5)
   - Significant UX improvement
   - Reduces server load

### Low Priority
5. **API route client reuse** (Issue #6)
   - Backend optimization
   - Less user-visible impact

6. **Upcoming stats memoization** (Issue #4)
   - Minor optimization
   - Code quality improvement

---

## Additional Considerations

### Caching Strategy
- **Redis caching** is now configured and working
- API responses should leverage Redis more aggressively
- Consider caching user follows client-side with TTL

### Future Enhancements
- Implement WebSocket for real-time follow updates
- Add service worker for offline follow management
- Lazy load movie images for faster initial render
- Implement virtual scrolling for large movie lists

---

## Notes
- All optimizations maintain backward compatibility
- No breaking changes to existing functionality
- Focus on algorithmic improvements over micro-optimizations
- Measure before/after with browser DevTools Performance tab
