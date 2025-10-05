import { NextRequest, NextResponse } from 'next/server'
import { dailyReleasesService } from '@/lib/services/cron/daily-releases-service'

/**
 * Cron Job: Daily Release Notifications
 *
 * Schedule: Daily at 9:00 AM
 * Purpose: Notify users when their followed movies are released today (theatrical or streaming)
 *
 * Usage:
 * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3010/api/cron/daily-releases
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
    console.log('[Cron] Starting daily-releases job...')
    const startTime = Date.now()

    const result = await dailyReleasesService.execute()

    const duration = Date.now() - startTime
    console.log(`[Cron] daily-releases completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      ...result
    })
  } catch (error) {
    console.error('[Cron] daily-releases failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
