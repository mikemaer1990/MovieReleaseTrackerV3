import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from '@/lib/redis'

/**
 * Redis Health Check Endpoint
 *
 * SECURITY:
 * - Only works in development mode (NODE_ENV !== 'production')
 * - Protected by CRON_SECRET authorization header
 *
 * Usage: GET /api/test-redis
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
  try {
    const testKey = 'test:redis:health'
    const testValue = { message: 'Redis is working!', timestamp: Date.now() }

    // Test SET
    await CacheService.set(testKey, testValue, 60) // 60 seconds TTL

    // Test GET
    const retrieved = await CacheService.get<typeof testValue>(testKey)

    if (!retrieved) {
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve cached value',
      })
    }

    // Test DELETE
    await CacheService.del(testKey)

    return NextResponse.json({
      success: true,
      message: 'Redis is working correctly!',
      test: {
        written: testValue,
        retrieved: retrieved,
        match: JSON.stringify(testValue) === JSON.stringify(retrieved)
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
