import { NextResponse } from 'next/server'
import { CacheService } from '@/lib/redis'

export async function GET() {
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
