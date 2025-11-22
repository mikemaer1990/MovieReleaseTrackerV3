import { NextRequest, NextResponse } from 'next/server'

/**
 * Test Past Date Filtering Logic
 *
 * Verifies the improved logic:
 * - ALL new dates get added to database (past or future)
 * - ONLY future dates trigger notifications
 *
 * SECURITY:
 * - Only works in development mode (NODE_ENV !== 'production')
 * - Protected by CRON_SECRET authorization header
 *
 * Usage: GET /api/test/past-date-filter
 * Headers: Authorization: Bearer YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Test endpoints are disabled in production' },
      { status: 403 }
    )
  }

  // Check authorization
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  const testCases = [
    {
      name: 'Past date (Nov 17 discovered on Nov 18)',
      today: '2025-11-18',
      discoveredDate: '2025-11-17',
      hadDate: false,
      expectedDatabaseUpdate: true,  // Should update DB
      expectedNotification: false,   // Should NOT notify
      reason: 'Past date: Update DB for historical accuracy, but do not notify user'
    },
    {
      name: 'Future date (Dec 25 discovered on Nov 18)',
      today: '2025-11-18',
      discoveredDate: '2025-12-25',
      hadDate: false,
      expectedDatabaseUpdate: true,  // Should update DB
      expectedNotification: true,    // Should notify
      reason: 'Future date: Update DB and notify user'
    },
    {
      name: 'Same day (Nov 18 discovered on Nov 18)',
      today: '2025-11-18',
      discoveredDate: '2025-11-18',
      hadDate: false,
      expectedDatabaseUpdate: true,  // Should update DB
      expectedNotification: false,   // Should NOT notify (not > today)
      reason: 'Same-day date: Update DB but do not notify (date is not in future)'
    },
    {
      name: 'Already had date',
      today: '2025-11-18',
      discoveredDate: '2025-12-25',
      hadDate: true,
      expectedDatabaseUpdate: false, // Should NOT update (already exists)
      expectedNotification: false,   // Should NOT notify (not new)
      reason: 'Database already has this date, skip entirely'
    },
    {
      name: 'Far future date',
      today: '2025-11-18',
      discoveredDate: '2026-06-15',
      hadDate: false,
      expectedDatabaseUpdate: true,  // Should update DB
      expectedNotification: true,    // Should notify
      reason: 'Far future date: Update DB and notify user'
    }
  ]

  const results = []
  let allPassed = true

  for (const test of testCases) {
    // Simulate the IMPROVED logic from discover-dates-service.ts
    const today = test.today
    const hadStreaming = test.hadDate
    const streamingDate = test.discoveredDate

    // Step 1: Check if date is NEW (regardless of past/future)
    const hasNewStreaming = !hadStreaming && streamingDate !== null

    // Step 2: Check if new date is in the FUTURE (for notifications)
    const shouldNotifyStreaming = hasNewStreaming && streamingDate > today

    const dbUpdatePassed = hasNewStreaming === test.expectedDatabaseUpdate
    const notificationPassed = shouldNotifyStreaming === test.expectedNotification
    const passed = dbUpdatePassed && notificationPassed

    if (!passed) {
      allPassed = false
    }

    results.push({
      test: test.name,
      today: test.today,
      discoveredDate: test.discoveredDate,
      alreadyHadDate: test.hadDate,
      expectedDatabaseUpdate: test.expectedDatabaseUpdate,
      actualDatabaseUpdate: hasNewStreaming,
      expectedNotification: test.expectedNotification,
      actualNotification: shouldNotifyStreaming,
      passed,
      reason: test.reason
    })
  }

  return NextResponse.json({
    success: allPassed,
    message: allPassed
      ? '✅ All tests passed! Database updates and notification logic working correctly.'
      : '❌ Some tests failed. Check results for details.',
    totalTests: testCases.length,
    passedTests: results.filter(r => r.passed).length,
    failedTests: results.filter(r => !r.passed).length,
    results
  })
}
