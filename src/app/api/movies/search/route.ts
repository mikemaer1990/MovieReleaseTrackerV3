import { NextRequest, NextResponse } from 'next/server'
import { tmdbService } from '@/lib/tmdb'
import { enrichMoviesWithDates } from '@/lib/tmdb-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const results = await tmdbService.searchMovies(query, page)
    
    // Enrich movies with unified release dates
    const enrichedMovies = await enrichMoviesWithDates(results.results)

    return NextResponse.json({
      ...results,
      results: enrichedMovies
    })
  } catch (error) {
    console.error('Movie search error:', error)
    return NextResponse.json(
      { error: 'Failed to search movies' },
      { status: 500 }
    )
  }
}