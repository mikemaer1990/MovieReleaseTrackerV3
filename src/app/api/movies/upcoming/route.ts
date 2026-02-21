import { NextRequest, NextResponse } from 'next/server'
import { UpcomingCacheService } from '@/lib/services/upcoming-cache-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sort') as 'popularity' | 'release_date' || 'popularity'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Validate parameters
    if (!['popularity', 'release_date'].includes(sortBy)) {
      return NextResponse.json(
        { error: 'Invalid sort parameter. Use "popularity" or "release_date"' },
        { status: 400 }
      )
    }

    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be >= 1' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Get movies from cache service (already enriched with runtime and release dates)
    const result = await UpcomingCacheService.getUpcomingMovies(sortBy, page, limit)

    return NextResponse.json({
      movies: result.movies,
      pagination: result.pagination,
      sort: sortBy,
      success: true
    })

  } catch (error) {
    console.error('Upcoming movies API error:', error)

    // Return more specific error information in development
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch upcoming movies'

    return NextResponse.json(
      {
        error: errorMessage,
        success: false
      },
      { status: 500 }
    )
  }
}

