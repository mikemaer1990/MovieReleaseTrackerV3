import { NextRequest, NextResponse } from 'next/server'
import { tmdbService } from '@/lib/tmdb'
import { enrichMoviesWithDates } from '@/lib/tmdb-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')

    const results = await tmdbService.getPopularMovies(page)
    
    // Enrich movies with unified release dates
    const enrichedMovies = await enrichMoviesWithDates(results.results)

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