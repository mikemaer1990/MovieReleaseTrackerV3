import { NextRequest, NextResponse } from 'next/server'
import { RecentCacheService } from '@/lib/services/recent-cache-service'

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting recent movies cache refresh...')
    const startTime = Date.now()

    // Rebuild the cache
    const result = await RecentCacheService.rebuildCache()

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    if (!result.success) {
      console.error('[CRON] Recent movies cache refresh failed:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          stats: result.stats,
          duration: `${duration}s`,
        },
        { status: 500 }
      )
    }

    console.log('[CRON] Recent movies cache refresh completed successfully')
    console.log(`[CRON] Stats:`, result.stats)
    console.log(`[CRON] Duration: ${duration}s`)

    return NextResponse.json({
      success: true,
      message: 'Recent movies cache refreshed successfully',
      stats: result.stats,
      duration: `${duration}s`,
      cacheBuiltAt: result.data?.cacheBuiltAt,
      filters: result.data?.filters,
    })
  } catch (error) {
    console.error('[CRON] Unexpected error during recent cache refresh:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
