import { NextRequest, NextResponse } from 'next/server'
import { tmdbService } from '@/lib/tmdb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const movieId = parseInt(id, 10)

    if (isNaN(movieId)) {
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      )
    }

    // Fetch enhanced movie details from TMDB with all append_to_response data
    const movieDetails = await tmdbService.getEnhancedMovieDetails(movieId)

    // Get unified release dates
    const unifiedDates = tmdbService.getUnifiedReleaseDates(movieDetails.release_dates)

    // Return enhanced movie details with unified dates
    return NextResponse.json({
      ...movieDetails,
      unifiedDates,
    })
  } catch (error) {
    console.error('Error fetching movie details:', error)

    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    )
  }
}
