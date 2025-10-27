import { NextResponse } from 'next/server'
import { CacheService } from '@/lib/redis'

export async function POST() {
  try {
    // Clear the upcoming movies cache keys
    await Promise.all([
      CacheService.del('upcoming_movies_popularity'),
      CacheService.del('upcoming_movies_release_date'),
      CacheService.del('upcoming_movies_metadata')
    ])

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully. Next request will rebuild the cache.'
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
