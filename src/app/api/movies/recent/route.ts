import { NextRequest, NextResponse } from 'next/server'
import { RecentCacheService } from '@/lib/services/recent-cache-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    // Validate parameters
    if (page < 1) {
      return NextResponse.json(
        { error: 'page must be >= 1' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Get recent movies from cache service
    const result = await RecentCacheService.getRecentMovies(page, limit)

    return NextResponse.json({
      movies: result.movies,
      pagination: result.pagination,
      filters: result.filters,
      success: true
    })

  } catch (error) {
    console.error('Recent movies API error:', error)

    // Return more specific error information in development
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recent movies'

    return NextResponse.json(
      {
        error: errorMessage,
        success: false
      },
      { status: 500 }
    )
  }
}
