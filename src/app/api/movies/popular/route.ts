import { NextRequest, NextResponse } from 'next/server'
import { tmdbService } from '@/lib/tmdb'
import { enrichMoviesWithDatesFast } from '@/lib/tmdb-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)

    const results = await tmdbService.getPopularMovies(page)

    // Filter out adult content as a safety net
    const filteredMovies = results.results.filter(movie => !movie.adult)

    // Enrich movies with unified release dates using fast method
    const enrichedMovies = await enrichMoviesWithDatesFast(filteredMovies)

    return NextResponse.json({
      ...results,
      results: enrichedMovies
    })
  } catch (error) {
    console.error('Popular movies error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular movies' },
      { status: 500 }
    )
  }
}