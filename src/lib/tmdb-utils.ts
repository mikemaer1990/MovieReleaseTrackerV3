import { TMDBMovie, UnifiedReleaseDates } from '@/types/movie'
import { tmdbService } from './tmdb'

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

export function getPosterUrl(posterPath: string | null, size: 'w154' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'): string | null {
  if (!posterPath) return null
  return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath}`
}

export function getBackdropUrl(backdropPath: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
  if (!backdropPath) return null
  return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath}`
}

// Utility to fetch and return unified release dates for a movie
export async function getUnifiedReleaseDatesForMovie(movieId: number): Promise<UnifiedReleaseDates> {
  try {
    const movieDetails = await tmdbService.getMovieDetails(movieId)
    return tmdbService.getUnifiedReleaseDates(movieDetails.release_dates)
  } catch (error) {
    console.error(`Failed to get release dates for movie ${movieId}:`, error)
    return {
      usTheatrical: null,
      streaming: null,
      primary: null,
      limited: null,
      digital: null,
    }
  }
}

// Enrich basic movie objects with unified release dates
export async function enrichMovieWithDates(movie: TMDBMovie): Promise<TMDBMovie & { unifiedDates: UnifiedReleaseDates }> {
  const unifiedDates = await getUnifiedReleaseDatesForMovie(movie.id)
  return {
    ...movie,
    unifiedDates
  }
}

// Batch enrich multiple movies with release dates
// Uses controlled concurrency to avoid overwhelming the API
export async function enrichMoviesWithDates(
  movies: TMDBMovie[],
  concurrency: number = 5
): Promise<(TMDBMovie & { unifiedDates: UnifiedReleaseDates })[]> {
  const enrichedMovies: (TMDBMovie & { unifiedDates: UnifiedReleaseDates })[] = []

  // Process movies in batches to control concurrency
  for (let i = 0; i < movies.length; i += concurrency) {
    const batch = movies.slice(i, i + concurrency)

    // Process batch in parallel
    const enrichedBatch = await Promise.all(
      batch.map(movie => enrichMovieWithDates(movie))
    )

    enrichedMovies.push(...enrichedBatch)

    // Small delay between batches to respect rate limits (except for last batch)
    if (i + concurrency < movies.length) {
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  }

  return enrichedMovies
}