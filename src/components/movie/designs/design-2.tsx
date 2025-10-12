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
  Calendar,
  Check,
  Plus,
  DollarSign,
  Globe,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Design2Props {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  isAuthenticated: boolean
  followTypes: FollowType[]
  followLoading: boolean
  onFollow: (movieId: number, followType: FollowType) => void
  onUnfollow: (movieId: number, followType: FollowType) => void
}

export default function Design2({
  movie,
  isAuthenticated,
  followTypes,
  followLoading,
  onFollow,
  onUnfollow
}: Design2Props) {
  const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0)

  // Helper variables
  const isFollowingBoth = followTypes.includes('BOTH')
  const isFollowingTheatrical = followTypes.includes('THEATRICAL') || isFollowingBoth
  const isFollowingStreaming = followTypes.includes('STREAMING') || isFollowingBoth

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null

  // Get trailers
  const trailers = movie.videos?.results.filter(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  ) || []

  // Get director & writers
  const director = movie.credits?.crew.find(c => c.job === 'Director')
  const writers = movie.credits?.crew.filter(c =>
    c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story'
  ).slice(0, 3) || []

  // Get main cast (top 10 like original)
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Bar - IMDb Style */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-bold">{movie.title}</h1>
            {movie.release_date && (
              <span className="text-xl text-zinc-400">
                ({new Date(movie.release_date).getFullYear()})
              </span>
            )}
            {movie.original_title !== movie.title && (
              <span className="text-sm text-zinc-500 italic">
                Original: {movie.original_title}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Left Sidebar - Poster & Quick Info */}
          <div className="space-y-6">
            {/* Poster */}
            {posterUrl && (
              <div className="relative aspect-[2/3] rounded overflow-hidden bg-zinc-900 border border-zinc-800">
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Rating Box - IMDb Style */}
            <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-400">IMDb RATING</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                <div>
                  <div className="text-3xl font-bold">
                    {movie.vote_average > 0 ? movie.vote_average.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {movie.vote_count.toLocaleString()} votes
                  </div>
                </div>
              </div>
            </div>

            {/* Follow Buttons */}
            {isAuthenticated && (
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => isFollowingTheatrical
                    ? onUnfollow(movie.id, isFollowingBoth ? 'BOTH' : 'THEATRICAL')
                    : onFollow(movie.id, 'THEATRICAL')
                  }
                  disabled={followLoading}
                  className={cn(
                    "w-full justify-start gap-2 border-zinc-700",
                    isFollowingTheatrical
                      ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                      : "hover:bg-zinc-800"
                  )}
                >
                  {isFollowingTheatrical ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <Film className="h-4 w-4" />
                  <span className="text-sm">Follow Theatrical</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => isFollowingStreaming
                    ? onUnfollow(movie.id, isFollowingBoth ? 'BOTH' : 'STREAMING')
                    : onFollow(movie.id, 'STREAMING')
                  }
                  disabled={followLoading}
                  className={cn(
                    "w-full justify-start gap-2 border-zinc-700",
                    isFollowingStreaming
                      ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                      : "hover:bg-zinc-800"
                  )}
                >
                  {isFollowingStreaming ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <Tv className="h-4 w-4" />
                  <span className="text-sm">Follow Streaming</span>
                </Button>

                {!isFollowingBoth && !isFollowingTheatrical && !isFollowingStreaming && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onFollow(movie.id, 'BOTH')}
                    disabled={followLoading}
                    className="w-full justify-start gap-2 border-zinc-700 bg-yellow-500/10 hover:bg-yellow-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Follow Both</span>
                  </Button>
                )}
              </div>
            )}

            {/* Quick Facts */}
            <div className="bg-zinc-900 border border-zinc-800 rounded p-4 space-y-3">
              <h3 className="font-bold text-sm text-zinc-400 uppercase">Details</h3>

              {movie.runtime > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Runtime</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm">{formatRuntime(movie.runtime)}</span>
                  </div>
                </div>
              )}

              {movie.status && movie.status !== 'Released' && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Status</div>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                    {movie.status}
                  </Badge>
                </div>
              )}

              {movie.original_language && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Original Language</div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm uppercase">{movie.original_language}</span>
                  </div>
                </div>
              )}

              {movie.unifiedDates.usTheatrical && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Theatrical Release</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm">{formatDate(movie.unifiedDates.usTheatrical)}</span>
                  </div>
                </div>
              )}

              {movie.unifiedDates.streaming && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Streaming Release</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm">{formatDate(movie.unifiedDates.streaming)}</span>
                  </div>
                </div>
              )}

              {movie.budget > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Budget</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm">{formatCurrency(movie.budget)}</span>
                  </div>
                </div>
              )}

              {movie.revenue > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Box Office</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm">{formatCurrency(movie.revenue)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="space-y-6">
            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map(genre => (
                <Badge key={genre.id} variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                  {genre.name}
                </Badge>
              ))}
            </div>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-lg italic text-zinc-400 border-l-4 border-yellow-500 pl-4">
                {movie.tagline}
              </p>
            )}

            {/* Overview */}
            <div>
              <h2 className="text-xl font-bold mb-3">Plot Summary</h2>
              <p className="text-zinc-300 leading-relaxed">
                {movie.overview || 'No plot summary available.'}
              </p>
            </div>

            {/* Credits Table - IMDb Style */}
            <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
              <div className="divide-y divide-zinc-800">
                {director && (
                  <div className="grid grid-cols-[120px_1fr] gap-4 p-4">
                    <div className="text-sm font-semibold text-zinc-400">Director</div>
                    <div className="text-sm text-zinc-200">{director.name}</div>
                  </div>
                )}

                {writers.length > 0 && (
                  <div className="grid grid-cols-[120px_1fr] gap-4 p-4">
                    <div className="text-sm font-semibold text-zinc-400">
                      {writers.length > 1 ? 'Writers' : 'Writer'}
                    </div>
                    <div className="text-sm text-zinc-200">
                      {writers.map(w => w.name).join(', ')}
                    </div>
                  </div>
                )}

                {movie.production_companies.length > 0 && (
                  <div className="grid grid-cols-[120px_1fr] gap-4 p-4">
                    <div className="text-sm font-semibold text-zinc-400">Production</div>
                    <div className="text-sm text-zinc-200">
                      {movie.production_companies.map(c => c.name).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trailers */}
            {trailers.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Videos</h2>
                <div className="space-y-3">
                  <div className="relative aspect-video rounded overflow-hidden bg-black border border-zinc-800">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailers[currentTrailerIndex].key}`}
                      title={trailers[currentTrailerIndex].name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>

                  {trailers.length > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentTrailerIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentTrailerIndex === 0}
                        className="border-zinc-700 hover:bg-zinc-800"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-zinc-400">
                        {currentTrailerIndex + 1} of {trailers.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentTrailerIndex(prev => Math.min(trailers.length - 1, prev + 1))}
                        disabled={currentTrailerIndex === trailers.length - 1}
                        className="border-zinc-700 hover:bg-zinc-800"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Where to Watch */}
            {usWatchProviders && (
              <div>
                <h2 className="text-xl font-bold mb-4">Where to Watch</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded p-4 space-y-4">
                  {usWatchProviders.flatrate && usWatchProviders.flatrate.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400 mb-3">Stream</h3>
                      <div className="flex flex-wrap gap-3">
                        {usWatchProviders.flatrate.map(provider => (
                          <div key={provider.provider_id} className="flex flex-col items-center gap-2">
                            <div className="relative w-12 h-12 rounded overflow-hidden border border-zinc-700">
                              <Image
                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                alt={provider.provider_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-xs text-center text-zinc-400">{provider.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {usWatchProviders.rent && usWatchProviders.rent.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400 mb-3">Rent</h3>
                      <div className="flex flex-wrap gap-3">
                        {usWatchProviders.rent.map(provider => (
                          <div key={provider.provider_id} className="flex flex-col items-center gap-2">
                            <div className="relative w-12 h-12 rounded overflow-hidden border border-zinc-700">
                              <Image
                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                alt={provider.provider_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-xs text-center text-zinc-400">{provider.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {usWatchProviders.buy && usWatchProviders.buy.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400 mb-3">Buy</h3>
                      <div className="flex flex-wrap gap-3">
                        {usWatchProviders.buy.map(provider => (
                          <div key={provider.provider_id} className="flex flex-col items-center gap-2">
                            <div className="relative w-12 h-12 rounded overflow-hidden border border-zinc-700">
                              <Image
                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                alt={provider.provider_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <span className="text-xs text-center text-zinc-400">{provider.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cast - Table Style */}
            {mainCast.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Cast</h2>
                <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                  <div className="divide-y divide-zinc-800">
                    {mainCast.map(actor => (
                      <div key={actor.id} className="grid grid-cols-[80px_1fr] gap-4 p-3 hover:bg-zinc-800/50 transition-colors">
                        <div className="relative aspect-[2/3] rounded overflow-hidden bg-zinc-800">
                          {actor.profile_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                              alt={actor.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xs text-zinc-600">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <div className="font-semibold text-sm text-zinc-200">{actor.name}</div>
                          <div className="text-sm text-zinc-400">as {actor.character}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Similar Movies */}
            {movie.similar && movie.similar.results.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">More Like This</h2>
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
    </div>
  )
}
