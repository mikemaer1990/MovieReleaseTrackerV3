import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MovieDetailsSwitcher from '@/components/movie/movie-details-switcher'
import { TMDBEnhancedMovieDetails, UnifiedReleaseDates } from '@/types/movie'
import { tmdbService } from '@/lib/tmdb'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ design?: string }>
}

async function getMovieDetails(id: string): Promise<(TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }) | null> {
  try {
    const movieId = parseInt(id, 10)
    if (isNaN(movieId)) {
      return null
    }

    // Fetch enhanced movie details directly from TMDB service
    const movieDetails = await tmdbService.getEnhancedMovieDetails(movieId)

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
      <MovieDetailsSwitcher movie={movie} initialDesign={design} />
    </>
  )
}
