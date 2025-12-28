import { NextRequest, NextResponse } from 'next/server'
import { dailyReleasesService } from '@/lib/services/cron/daily-releases-service'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Cron Job: Daily Release Notifications
 *
 * Schedule: Daily at 6:00 AM PST (14:00 UTC)
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

  const healthcheckUrl = process.env.HEALTHCHECK_DAILY_RELEASES_URL

  try {
    console.log('[Cron] Starting daily-releases job...')
    const startTime = Date.now()

    const result = await dailyReleasesService.execute()

    const duration = Date.now() - startTime
    console.log(`[Cron] daily-releases completed in ${duration}ms`)

    // Ping healthcheck on success
    if (healthcheckUrl) {
      fetch(healthcheckUrl)
        .then(() => console.log('[Cron] Healthcheck ping sent'))
        .catch(err => console.error('[Cron] Healthcheck ping failed:', err))
    }

    return NextResponse.json({
      ...result,
      duration: `${duration}ms`,
      healthcheckPinged: !!healthcheckUrl
    })
  } catch (error) {
    console.error('[Cron] daily-releases failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Ping healthcheck with failure and error message
    if (healthcheckUrl) {
      fetch(`${healthcheckUrl}/fail`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: errorMessage
      })
        .then(() => console.log('[Cron] Healthcheck failure ping sent'))
        .catch(err => console.error('[Cron] Healthcheck failure ping failed:', err))
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        healthcheckPinged: !!healthcheckUrl
      },
      { status: 500 }
    )
  }
}
