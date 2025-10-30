import { NextRequest, NextResponse } from 'next/server'
import { UpcomingCacheService } from '@/lib/services/upcoming-cache-service'
import { emailService } from '@/lib/services/email-service'

/**
 * Cron Job: Refresh Upcoming Movies Cache
 *
 * Schedule: Daily at 3:00 AM UTC
 * Purpose: Rebuild the upcoming movies cache to ensure fresh data
 *
 * Usage:
 * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3010/api/cron/refresh-cache
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
    console.log('[Cron] Starting refresh-cache job...')
    const startTime = Date.now()

    const result = await UpcomingCacheService.rebuildCache()

    const duration = Date.now() - startTime

    if (!result.success) {
      // Cache refresh failed - send email notification
      console.error(`[Cron] Cache refresh failed: ${result.error}`)

      await sendFailureNotification(result.error || 'Unknown error', result.stats)

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          stats: result.stats,
          duration: `${duration}ms`
        },
        { status: 500 }
      )
    }

    console.log(`[Cron] refresh-cache completed successfully in ${duration}ms`)
    console.log('[Cron] Cache stats:', result.stats)

    return NextResponse.json({
      success: true,
      stats: result.stats,
      duration: `${duration}ms`,
      message: 'Cache refreshed successfully'
    })

  } catch (error) {
    console.error('[Cron] refresh-cache failed with exception:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Send email notification on unexpected error
    await sendFailureNotification(errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}

/**
 * Send email notification when cache refresh fails
 */
async function sendFailureNotification(error: string, stats?: { totalFetched: number; totalPages: number; duplicatesRemoved: number; moviesWithin6Months: number; foundMoviesBeyondCutoff: boolean }) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'mike@moviereleasetracker.online'

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Cache Refresh Failed</h1>
        </div>

        <div style="padding: 30px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-top: 0;">Cache Refresh Error</h2>

          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 500;">Error Message:</p>
            <p style="margin: 8px 0 0 0; color: #7f1d1d; font-family: monospace;">${error}</p>
          </div>

          ${stats ? `
            <div style="margin: 20px 0;">
              <p style="color: #4b5563; margin: 0 0 10px 0; font-weight: 500;">Stats:</p>
              <pre style="background-color: #e5e7eb; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(stats, null, 2)}</pre>
            </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1d5db;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              <strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC
            </p>
            <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">
              <strong>Job:</strong> Upcoming Movies Cache Refresh (Daily 3 AM UTC)
            </p>
          </div>

          <div style="margin-top: 30px; padding: 16px; background-color: #dbeafe; border-radius: 4px;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              <strong>💡 Note:</strong> The cache will be automatically rebuilt on the next request. Users may experience slower load times until then.
            </p>
          </div>
        </div>

        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">Movie Release Tracker - Automated Cache Refresh</p>
        </div>
      </div>
    `

    await emailService.sendAdminNotification(
      adminEmail,
      '⚠️ Cache Refresh Failed - Movie Release Tracker',
      htmlContent
    )

    console.log(`[Cron] Failure notification sent to ${adminEmail}`)

  } catch (emailError) {
    console.error('[Cron] Failed to send failure notification email:', emailError)
    // Don't throw - we don't want email failures to crash the cron job response
  }
}
