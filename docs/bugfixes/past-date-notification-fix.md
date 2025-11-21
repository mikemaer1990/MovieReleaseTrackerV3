# Bug Fix: Past Date Notifications

## Issue
User received an email notification on **November 18, 2025** for "Wicked: For Good" with a streaming release date of **November 17, 2025** (already passed).

## Root Cause Analysis

### Primary Bug: No Past Date Validation
**Location:** `src/lib/services/cron/discover-dates-service.ts:152-153`

**Problem:** The date discovery cron job was sending notifications for dates that had already passed. The code only checked:
1. If the date was new (not already in database)
2. If the date was not null

It **did not check** if the date was in the future.

### Contributing Factor: TMDB Data Change
Investigation revealed that TMDB had incorrect data on November 18:
- **Nov 18, 11:53 AM**: TMDB listed Nov 17 as Type 4 (Digital/Streaming)
- **After Nov 18**: TMDB corrected it to Type 1 (Premiere) with note "New York City, New York"

The cron job correctly extracted the Type 4 data from TMDB at the time, but should not have sent a notification since the date was already in the past.

## The Fix

Added past date validation to prevent notifications for dates that have already occurred.

**File:** `src/lib/services/cron/discover-dates-service.ts`

**Before:**
```typescript
const hasNewTheatrical = !hadTheatrical && theatricalDate !== null
const hasNewStreaming = !hadStreaming && streamingDate !== null
```

**After:**
```typescript
// Get current date (in UTC, formatted as YYYY-MM-DD)
const today = new Date().toISOString().split('T')[0]

// Check if dates are new AND in the future (don't notify for past dates)
const hasNewTheatrical = !hadTheatrical && theatricalDate !== null && theatricalDate > today
const hasNewStreaming = !hadStreaming && streamingDate !== null && streamingDate > today
```

## Testing

Created comprehensive tests to verify:
1. ✅ Past dates are ignored (no notification)
2. ✅ Same-day dates are ignored (no notification)
3. ✅ Future dates trigger notifications (expected behavior)
4. ✅ Already existing dates are ignored (expected behavior)

All tests passed successfully.

## Impact

**Before Fix:**
- Users could receive notifications for dates that already passed
- Confusing user experience
- Irrelevant notifications

**After Fix:**
- Only future dates trigger notifications
- Better user experience
- No more notifications for past dates

## Related Files
- `src/lib/services/cron/discover-dates-service.ts` - Main fix location
- Database: `release_dates` table may contain past dates (harmless, just not notified)

## Date: November 20, 2025
## Reported By: User (mikemaer1990@gmail.com)
## Fixed By: Claude Code
