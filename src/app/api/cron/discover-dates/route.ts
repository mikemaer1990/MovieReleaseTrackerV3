import { NextRequest, NextResponse } from 'next/server'
import { discoverDatesService } from '@/lib/services/cron/discover-dates-service'

/**
 * Cron Job: Discover Missing Release Dates
 *
 * Schedule: Daily at 3:00 AM PST / 11:00 UTC (runs before daily-releases)
 * Purpose: Find missing theatrical/streaming dates for followed movies
 *
 * Usage:
 * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3010/api/cron/discover-dates
 */
export async function GET(request: NextRequest) {
  // Security: Verify cron secret
  const authHeader = request.headers.get('authorization')
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`

  if (!expectedSecret || authHeader !== expectedSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[Cron] Starting discover-dates job...')
    const startTime = Date.now()

    const result = await discoverDatesService.execute()

    const duration = Date.now() - startTime
    console.log(`[Cron] discover-dates completed in ${duration}ms`)

    return NextResponse.json({
      ...result,
      duration: `${duration}ms`
    })
  } catch (error) {
    console.error('[Cron] discover-dates failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
