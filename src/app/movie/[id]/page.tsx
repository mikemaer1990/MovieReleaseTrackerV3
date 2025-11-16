import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import MovieDetailsSwitcher from '@/components/movie/movie-details-switcher'
import { TMDBEnhancedMovieDetails, UnifiedReleaseDates, MovieRatings } from '@/types/movie'
import { tmdbService } from '@/lib/tmdb'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ design?: string }>
}

// Wrap in React cache() to deduplicate calls within the same request
// This prevents duplicate API calls when both generateMetadata and the page component fetch the same movie
const getMovieDetails = cache(async (id: string): Promise<(TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }) | null> => {
  try {
    const movieId = parseInt(id, 10)
    if (isNaN(movieId)) {
      return null
    }

    // Fetch enhanced movie details directly from TMDB service
    const tmdbStart = Date.now()
    const movieDetails = await tmdbService.getEnhancedMovieDetails(movieId)
    const tmdbDuration = Date.now() - tmdbStart
    console.log(`[PERF] TMDB getEnhancedMovieDetails(${movieId}) took ${tmdbDuration}ms`)

    // Get unified release dates
    const unifiedDates = tmdbService.getUnifiedReleaseDates(movieDetails.release_dates)

    return {
      ...movieDetails,
      unifiedDates,
    }
  } catch (error) {
    console.error('Error fetching movie details:', error)
    return null
  }
})

async function getInitialRatings(movie: TMDBEnhancedMovieDetails): Promise<MovieRatings> {
  const ratings: MovieRatings = {}

  // Add TMDB rating
  if (movie.vote_average > 0) {
    ratings.tmdb = {
      score: movie.vote_average,
      voteCount: movie.vote_count,
      url: `https://www.themoviedb.org/movie/${movie.id}`,
    }
  }

  // Try to fetch OMDB ratings with a 1-second timeout
  // If it responds quickly, include them in initial render
  // If it's slow, they'll be loaded client-side
  if (movie.external_ids?.imdb_id) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 1000)
      )

      const omdbPromise = (async () => {
        const { omdbService } = await import('@/lib/omdb')
        return omdbService.getRatingsByImdbId(movie.external_ids.imdb_id!)
      })()

      const omdbRatings = await Promise.race([omdbPromise, timeoutPromise]) as Partial<MovieRatings>
      console.log(`[PERF] OMDB loaded quickly, including in initial render`)
      Object.assign(ratings, omdbRatings)
    } catch (error) {
      // Timeout or error - will be loaded client-side
      if (error instanceof Error && error.message === 'timeout') {
        console.log(`[PERF] OMDB timeout, will load client-side`)
      } else {
        console.error('Error fetching OMDB ratings:', error)
      }
    }
  }

  return ratings
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const movie = await getMovieDetails(id)

  if (!movie) {
    return {
      title: 'Movie Not Found',
    }
  }

  return {
    title: `${movie.title} - Movie Tracker`,
    description: movie.overview || `Details for ${movie.title}`,
    openGraph: {
      title: movie.title,
      description: movie.overview || undefined,
      images: movie.poster_path
        ? [`https://image.tmdb.org/t/p/w500${movie.poster_path}`]
        : [],
    },
  }
}

export default async function MovieDetailsPage({ params, searchParams }: Props) {
  const { id } = await params
  const { design } = await searchParams
  const movie = await getMovieDetails(id)

  if (!movie) {
    notFound()
  }

  // Get initial ratings - tries OMDB with 1s timeout
  const initialRatings = await getInitialRatings(movie)

  // Generate structured data for SEO
  const director = movie.credits?.crew.find(c => c.job === 'Director')
  const mainCast = movie.credits?.cast.slice(0, 10) || []

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: movie.overview,
    image: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : undefined,
    datePublished: movie.release_date || undefined,
    genre: movie.genres.map(g => g.name),
    ...(director && {
      director: {
        '@type': 'Person',
        name: director.name,
      },
    }),
    ...(mainCast.length > 0 && {
      actor: mainCast.map(actor => ({
        '@type': 'Person',
        name: actor.name,
      })),
    }),
    ...(movie.vote_average > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: movie.vote_average.toFixed(1),
        ratingCount: movie.vote_count,
        bestRating: '10',
        worstRating: '0',
      },
    }),
    ...(movie.runtime > 0 && {
      duration: `PT${movie.runtime}M`,
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MovieDetailsSwitcher movie={movie} initialRatings={initialRatings} initialDesign={design} />
    </>
  )
}
