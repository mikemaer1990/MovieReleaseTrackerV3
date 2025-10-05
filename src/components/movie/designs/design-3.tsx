'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TMDBEnhancedMovieDetails, UnifiedReleaseDates, FollowType } from '@/types/movie'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MovieCard } from '@/components/movie/movie-card'
import {
  Star,
  Clock,
  Film,
  Tv,
  Check,
  Plus,
  Play,
  Info,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Globe
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Design3Props {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  isAuthenticated: boolean
  followTypes: FollowType[]
  followLoading: boolean
  onFollow: (movieId: number, followType: FollowType) => void
  onUnfollow: (movieId: number, followType: FollowType) => void
}

export default function Design3({
  movie,
  isAuthenticated,
  followTypes,
  followLoading,
  onFollow,
  onUnfollow
}: Design3Props) {
  const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0)
  const [showInfo, setShowInfo] = useState(false)

  // Helper variables
  const isFollowingBoth = followTypes.includes('BOTH')
  const isFollowingTheatrical = followTypes.includes('THEATRICAL') || isFollowingBoth
  const isFollowingStreaming = followTypes.includes('STREAMING') || isFollowingBoth

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null

  // Get trailers
  const trailers = movie.videos?.results.filter(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  ) || []

  // Get director
  const director = movie.credits?.crew.find(c => c.job === 'Director')

  // Get main cast (top 10)
  const mainCast = movie.credits?.cast.slice(0, 10) || []

  // Get US watch providers
  const usWatchProviders = movie['watch/providers']?.results?.US

  // Format runtime
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Netflix Style with Backdrop/Video */}
      <div className="relative w-full h-[80vh] min-h-[600px]">
        {/* Backdrop or Trailer */}
        {trailers.length > 0 ? (
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${trailers[0].key}?autoplay=1&mute=1&loop=1&playlist=${trailers[0].key}&controls=0&showinfo=0&rel=0&modestbranding=1`}
              title={movie.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: 'scale(1.5)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
          </div>
        ) : backdropUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={backdropUrl}
              alt={movie.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
        )}

        {/* Hero Content - Netflix Style */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold drop-shadow-2xl">
              {movie.title}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-lg">
              {movie.vote_average > 0 && (
                <div className="flex items-center gap-2 text-green-400 font-bold">
                  <Star className="h-5 w-5 fill-current" />
                  <span>{Math.round(movie.vote_average * 10)}% Match</span>
                </div>
              )}
              {movie.release_date && (
                <span className="text-zinc-300">
                  {new Date(movie.release_date).getFullYear()}
                </span>
              )}
              {movie.runtime > 0 && (
                <span className="text-zinc-300">{formatRuntime(movie.runtime)}</span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.slice(0, 3).map(genre => (
                <span key={genre.id} className="text-zinc-300">
                  {genre.name}
                </span>
              )).reduce((prev, curr, i) => i === 0 ? [curr] : [...prev, <span key={`sep-${i}`} className="text-zinc-600">•</span>, curr], [] as React.ReactNode[])}
            </div>

            {/* Overview */}
            <p className="text-lg text-zinc-200 max-w-xl leading-relaxed line-clamp-3">
              {movie.overview || 'No overview available.'}
            </p>

            {/* Action Buttons - Netflix Style */}
            <div className="flex flex-wrap gap-3">
              {trailers.length > 0 && (
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 font-bold gap-2"
                >
                  <Play className="h-6 w-6 fill-current" />
                  Play Trailer
                </Button>
              )}

              <Button
                size="lg"
                variant="ghost"
                onClick={() => setShowInfo(!showInfo)}
                className="bg-zinc-700/80 hover:bg-zinc-700 font-bold gap-2"
              >
                <Info className="h-5 w-5" />
                More Info
              </Button>

              {isAuthenticated && (
                <>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => isFollowingTheatrical
                      ? onUnfollow(movie.id, isFollowingBoth ? 'BOTH' : 'THEATRICAL')
                      : onFollow(movie.id, 'THEATRICAL')
                    }
                    disabled={followLoading}
                    className={cn(
                      "gap-2 font-semibold",
                      isFollowingTheatrical
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-zinc-700/80 hover:bg-zinc-700"
                    )}
                  >
                    {isFollowingTheatrical ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    <Film className="h-5 w-5" />
                    Theatrical
                  </Button>

                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => isFollowingStreaming
                      ? onUnfollow(movie.id, isFollowingBoth ? 'BOTH' : 'STREAMING')
                      : onFollow(movie.id, 'STREAMING')
                    }
                    disabled={followLoading}
                    className={cn(
                      "gap-2 font-semibold",
                      isFollowingStreaming
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-zinc-700/80 hover:bg-zinc-700"
                    )}
                  >
                    {isFollowingStreaming ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    <Tv className="h-5 w-5" />
                    Streaming
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* More Info Section */}
      <div className="relative z-10 bg-black">
        <div className="container mx-auto px-4 md:px-8 py-12 space-y-12">
          {/* About Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12">
            <div className="space-y-8">
              {/* Extended Overview */}
              <div>
                <h2 className="text-2xl font-bold mb-4">About {movie.title}</h2>
                <p className="text-zinc-300 text-lg leading-relaxed">
                  {movie.overview || 'No overview available.'}
                </p>
                {movie.tagline && (
                  <p className="text-zinc-400 italic mt-4 text-lg">&quot;{movie.tagline}&quot;</p>
                )}
              </div>

              {/* Cast */}
              {mainCast.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Cast</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {mainCast.map(actor => (
                      <div key={actor.id} className="space-y-2">
                        <div className="relative aspect-square rounded-full overflow-hidden bg-zinc-900">
                          {actor.profile_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                              alt={actor.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-zinc-600">
                              <Film className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-sm">{actor.name}</p>
                          <p className="text-xs text-zinc-400 line-clamp-1">{actor.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* More Trailers */}
              {trailers.length > 1 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Trailers & More</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {trailers.map((trailer, index) => (
                      <div key={trailer.id} className="relative aspect-video rounded overflow-hidden bg-zinc-900 group cursor-pointer">
                        <Image
                          src={`https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`}
                          alt={trailer.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Play className="h-12 w-12 text-white fill-white drop-shadow-lg" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black">
                          <p className="text-sm font-semibold">{trailer.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6 text-sm">
              {director && (
                <div>
                  <span className="text-zinc-500">Director: </span>
                  <span className="text-white">{director.name}</span>
                </div>
              )}

              <div>
                <span className="text-zinc-500">Genres: </span>
                <span className="text-white">{movie.genres.map(g => g.name).join(', ')}</span>
              </div>

              {movie.status && (
                <div>
                  <span className="text-zinc-500">Status: </span>
                  <Badge variant="outline" className="border-zinc-700 text-white">
                    {movie.status}
                  </Badge>
                </div>
              )}

              {movie.original_language && (
                <div>
                  <span className="text-zinc-500">Original Language: </span>
                  <span className="text-white uppercase">{movie.original_language}</span>
                </div>
              )}

              {movie.unifiedDates.usTheatrical && (
                <div>
                  <span className="text-zinc-500">Theatrical Release: </span>
                  <span className="text-white">{formatDate(movie.unifiedDates.usTheatrical)}</span>
                </div>
              )}

              {movie.unifiedDates.streaming && (
                <div>
                  <span className="text-zinc-500">Streaming Release: </span>
                  <span className="text-white">{formatDate(movie.unifiedDates.streaming)}</span>
                </div>
              )}

              {movie.budget > 0 && (
                <div>
                  <span className="text-zinc-500">Budget: </span>
                  <span className="text-white">{formatCurrency(movie.budget)}</span>
                </div>
              )}

              {movie.revenue > 0 && (
                <div>
                  <span className="text-zinc-500">Box Office: </span>
                  <span className="text-white">{formatCurrency(movie.revenue)}</span>
                </div>
              )}

              {movie.production_companies.length > 0 && (
                <div>
                  <span className="text-zinc-500">Production: </span>
                  <span className="text-white">{movie.production_companies.map(c => c.name).join(', ')}</span>
                </div>
              )}

              {movie.vote_average > 0 && (
                <div>
                  <span className="text-zinc-500">Rating: </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-white font-bold">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-zinc-400">({movie.vote_count.toLocaleString()} votes)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Where to Watch */}
          {usWatchProviders && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Where to Watch</h2>
              <div className="space-y-6">
                {usWatchProviders.flatrate && usWatchProviders.flatrate.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-zinc-400">Available to Stream</h3>
                    <div className="flex flex-wrap gap-4">
                      {usWatchProviders.flatrate.map(provider => (
                        <div key={provider.provider_id} className="flex flex-col items-center gap-2">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-2 ring-zinc-700 hover:ring-white transition-all">
                            <Image
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs text-center">{provider.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {usWatchProviders.rent && usWatchProviders.rent.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-zinc-400">Available to Rent</h3>
                    <div className="flex flex-wrap gap-4">
                      {usWatchProviders.rent.map(provider => (
                        <div key={provider.provider_id} className="flex flex-col items-center gap-2">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-2 ring-zinc-700 hover:ring-white transition-all">
                            <Image
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs text-center">{provider.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {usWatchProviders.buy && usWatchProviders.buy.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-zinc-400">Available to Buy</h3>
                    <div className="flex flex-wrap gap-4">
                      {usWatchProviders.buy.map(provider => (
                        <div key={provider.provider_id} className="flex flex-col items-center gap-2">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-2 ring-zinc-700 hover:ring-white transition-all">
                            <Image
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs text-center">{provider.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Similar Movies */}
          {movie.similar && movie.similar.results.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">More Like This</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {movie.similar.results.slice(0, 12).map(similarMovie => (
                  <MovieCard
                    key={similarMovie.id}
                    movie={similarMovie}
                    onFollow={onFollow}
                    onUnfollow={onUnfollow}
                    followTypes={[]}
                    loading={followLoading}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
