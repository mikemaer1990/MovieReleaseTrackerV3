import { NextRequest, NextResponse } from 'next/server'
import { tmdbService } from '@/lib/tmdb'
import { enrichMoviesWithDates } from '@/lib/tmdb-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1', 10)

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const results = await tmdbService.searchMovies(query, page)

    // Enrich movies with unified release dates
    const enrichedMovies = await enrichMoviesWithDates(results.results)

    // Sort movies: unreleased first (by release date), then released (by popularity)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time for accurate date comparison

    // Helper: Get the best release date for a movie
    const getBestReleaseDate = (movie: typeof enrichedMovies[0]): Date | null => {
      const dateStr = movie.unifiedDates.usTheatrical ||
                     movie.unifiedDates.primary ||
                     movie.release_date
      return dateStr ? new Date(dateStr) : null
    }

    // Split into unreleased and released
    const unreleased = enrichedMovies.filter(movie => {
      const releaseDate = getBestReleaseDate(movie)
      return !releaseDate || releaseDate > today
    })

    const released = enrichedMovies.filter(movie => {
      const releaseDate = getBestReleaseDate(movie)
      return releaseDate && releaseDate <= today
    })

    // Sort unreleased by date ascending (soonest first)
    unreleased.sort((a, b) => {
      const dateA = getBestReleaseDate(a)
      const dateB = getBestReleaseDate(b)

      // Movies without dates go to the end
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1

      return dateA.getTime() - dateB.getTime()
    })

    // Sort released by popularity descending (most popular first)
    released.sort((a, b) => b.popularity - a.popularity)

    // Combine: unreleased first, then released
    const sortedMovies = [...unreleased, ...released]

    return NextResponse.json({
      ...results,
      results: sortedMovies
    })
  } catch (error) {
    console.error('Movie search error:', error)
    return NextResponse.json(
      { error: 'Failed to search movies' },
      { status: 500 }
    )
  }
}