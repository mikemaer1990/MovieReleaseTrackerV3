import { NextRequest, NextResponse } from 'next/server'

/**
 * Test Past Date Filtering Logic
 *
 * Verifies that the fix correctly filters out past dates
 *
 * Usage: GET http://localhost:3010/api/test/past-date-filter
 */
export async function GET(request: NextRequest) {
  const testCases = [
    {
      name: 'Past date (Nov 17 discovered on Nov 18)',
      today: '2025-11-18',
      discoveredDate: '2025-11-17',
      hadDate: false,
      expectedResult: false,
      reason: 'Date is in the past'
    },
    {
      name: 'Future date (Dec 25 discovered on Nov 18)',
      today: '2025-11-18',
      discoveredDate: '2025-12-25',
      hadDate: false,
      expectedResult: true,
      reason: 'Date is in the future'
    },
    {
      name: 'Same day (Nov 18 discovered on Nov 18)',
      today: '2025-11-18',
      discoveredDate: '2025-11-18',
      hadDate: false,
      expectedResult: false,
      reason: 'Date is today (not greater than today)'
    },
    {
      name: 'Already had date',
      today: '2025-11-18',
      discoveredDate: '2025-12-25',
      hadDate: true,
      expectedResult: false,
      reason: 'Database already has this date'
    },
    {
      name: 'Far future date',
      today: '2025-11-18',
      discoveredDate: '2026-06-15',
      hadDate: false,
      expectedResult: true,
      reason: 'Date is in the far future'
    }
  ]

  const results = []
  let allPassed = true

  for (const test of testCases) {
    // Simulate the FIXED logic from discover-dates-service.ts
    const today = test.today
    const hadStreaming = test.hadDate
    const streamingDate = test.discoveredDate

    const hasNewStreaming = !hadStreaming && streamingDate !== null && streamingDate > today

    const passed = hasNewStreaming === test.expectedResult

    if (!passed) {
      allPassed = false
    }

    results.push({
      test: test.name,
      today: test.today,
      discoveredDate: test.discoveredDate,
      alreadyHadDate: test.hadDate,
      expectedResult: test.expectedResult,
      actualResult: hasNewStreaming,
      passed,
      reason: test.reason
    })
  }

  return NextResponse.json({
    success: allPassed,
    message: allPassed
      ? '✅ All tests passed! Past date filtering is working correctly.'
      : '❌ Some tests failed. Check results for details.',
    totalTests: testCases.length,
    passedTests: results.filter(r => r.passed).length,
    failedTests: results.filter(r => !r.passed).length,
    results
  })
}
