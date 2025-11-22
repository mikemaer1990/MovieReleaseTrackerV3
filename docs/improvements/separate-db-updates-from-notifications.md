# Improvement: Separate Database Updates from Notifications

## Overview

Improved the date discovery cron job to **always update the database** with discovered release dates (past or future), but **only send notifications** for future dates.

## Date Implemented
November 22, 2025

## The Problem

**Before this change:**
- Cron job only processed dates that were both NEW and in the FUTURE
- If a date was discovered but already in the past, it was completely skipped
- Database ended up with incomplete/missing historical data

**Example:**
- Movie releases on Nov 15
- Cron discovers the date on Nov 20
- Old behavior: "Past date! Skip entirely" → Database missing the date
- User sees: No theatrical release date even though movie already released

## The Solution

**After this change:**
- Cron job processes ALL new dates (past or future)
- Database gets updated with complete historical data
- Notifications only sent for future dates (avoids spam)

**Same example:**
- Movie releases on Nov 15
- Cron discovers the date on Nov 20
- New behavior: "Add to DB (historical accuracy), but don't notify (already passed)"
- User sees: Correct theatrical release date showing "Released on Nov 15"

## Implementation Details

**File:** `src/lib/services/cron/discover-dates-service.ts`

### Before:
```typescript
// Check if dates are new AND in the future (don't notify for past dates)
const hasNewTheatrical = !hadTheatrical && theatricalDate !== null && theatricalDate > today
const hasNewStreaming = !hadStreaming && streamingDate !== null && streamingDate > today

if (hasNewTheatrical || hasNewStreaming) {
  // Update database
  // Send notification
}
```

### After:
```typescript
// Step 1: Check if dates are NEW (regardless of past/future)
const hasNewTheatrical = !hadTheatrical && theatricalDate !== null
const hasNewStreaming = !hadStreaming && streamingDate !== null

// Step 2: Check if new dates are in the FUTURE (for notifications)
const shouldNotifyTheatrical = hasNewTheatrical && theatricalDate > today
const shouldNotifyStreaming = hasNewStreaming && streamingDate > today

// Step 3: Update database with ALL new dates (past or future)
if (hasNewTheatrical || hasNewStreaming) {
  await updateDatabase(...)

  // Step 4: Only notify for FUTURE dates
  if (shouldNotifyTheatrical || shouldNotifyStreaming) {
    await sendNotification(...)
  }
}
```

## Test Coverage

**Test endpoint:** `/api/test/past-date-filter`

All 5 test cases pass:

| Scenario | DB Update | Notification | Reason |
|----------|-----------|--------------|--------|
| Past date (Nov 17 on Nov 18) | ✅ Yes | ❌ No | Historical accuracy, no spam |
| Future date (Dec 25 on Nov 18) | ✅ Yes | ✅ Yes | Normal flow |
| Same-day date (Nov 18 on Nov 18) | ✅ Yes | ❌ No | Not future (not > today) |
| Already had date | ❌ No | ❌ No | Not new |
| Far future date (Jun 2026) | ✅ Yes | ✅ Yes | Normal flow |

## Benefits

### 1. Complete Historical Data ✅
- Database has accurate record of all release dates
- Users can see when movies actually released (not just upcoming)
- Better for analytics and reporting

### 2. No Notification Spam ✅
- Users only get notified about upcoming releases
- Past dates silently added to DB for reference
- Same-day releases don't trigger notifications

### 3. Data Integrity ✅
- No more missing dates due to late discovery
- Handles TMDB data corrections better
- Historical accuracy maintained

### 4. Better User Experience ✅
- "Released on X date" shows correctly even if discovered late
- Streaming status accurately reflects actual release dates
- No confusing notifications about past events

## Real-World Example

**Wicked: For Good Case:**

**Old behavior:**
- Nov 18: TMDB temporarily shows Nov 17 as streaming date
- Cron runs: "Nov 17 is past! Skip it"
- Nov 18: TMDB corrects data (removes Nov 17)
- Result: Missing data, confusing state

**New behavior:**
- Nov 18: TMDB temporarily shows Nov 17 as streaming date
- Cron runs: "Add Nov 17 to DB (historical), don't notify (past)"
- Nov 18: TMDB corrects data
- Result: DB has historical record, user sees accurate "already released" state

## Related Files

- `src/lib/services/cron/discover-dates-service.ts` - Main implementation
- `src/app/api/test/past-date-filter/route.ts` - Test endpoint
- `docs/bugfixes/past-date-notification-fix.md` - Original bug that led to this improvement

## Migration Notes

**No data migration needed** - This is a forward-looking improvement. Existing data remains unchanged. Future cron runs will benefit from the new logic.

## Status

✅ **Implemented and Tested**
- All tests passing
- Logic validated
- Ready for production
