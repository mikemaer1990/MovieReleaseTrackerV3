import { NextRequest, NextResponse } from 'next/server'
import { UpcomingCacheService } from '@/lib/services/upcoming-cache-service'
import { enrichMoviesWithDates } from '@/lib/tmdb-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sort') as 'popularity' | 'release_date' || 'popularity'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    // Get movies from cache service
    const result = await UpcomingCacheService.getUpcomingMovies(sortBy, page, limit)

    // Enrich movies with unified release dates
    const enrichedMovies = await enrichMoviesWithDates(result.movies)

    return NextResponse.json({
      movies: enrichedMovies,
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

// Optional: Add a POST endpoint for manual cache refresh (useful for testing)
export async function POST(request: NextRequest) {
  try {
    // In a production app, you might want to add authentication here
    // to prevent unauthorized cache refreshes

    const result = await UpcomingCacheService.rebuildCache()

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          stats: result.stats,
          success: false
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Cache rebuilt successfully',
      stats: result.stats,
      success: true
    })

  } catch (error) {
    console.error('Cache rebuild error:', error)
    return NextResponse.json(
      { error: 'Failed to rebuild cache' },
      { status: 500 }
    )
  }
}