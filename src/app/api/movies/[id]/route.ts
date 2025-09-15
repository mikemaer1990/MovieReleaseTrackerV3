import { NextRequest, NextResponse } from 'next/server'
import { tmdbService } from '@/lib/tmdb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const movieId = parseInt(resolvedParams.id)

    if (isNaN(movieId)) {
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      )
    }

    const movie = await tmdbService.getMovieDetails(movieId)
    const releaseDates = tmdbService.getUnifiedReleaseDates(movie.release_dates)

    return NextResponse.json({
      ...movie,
      unifiedDates: releaseDates,
    })
  } catch (error) {
    console.error('Movie details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch movie details' },
      { status: 500 }
    )
  }
}