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
  Calendar,
  DollarSign,
  Globe,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Design4Props {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  isAuthenticated: boolean
  followTypes: FollowType[]
  followLoading: boolean
  onFollow: (followType: FollowType) => void
  onUnfollow: (followType: FollowType) => void
}

export default function Design4({
  movie,
  isAuthenticated,
  followTypes,
  followLoading,
  onFollow,
  onUnfollow
}: Design4Props) {
  const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0)

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
    <div className="min-h-screen bg-zinc-950">
      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Side - Visual Content */}
        <div className="relative bg-black flex flex-col justify-center items-center p-8 lg:p-12">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.03) 10px, rgba(255,255,255,.03) 20px)'
            }} />
          </div>

          <div className="relative z-10 w-full max-w-md space-y-8">
            {/* Poster with frame */}
            {posterUrl && (
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-yellow-600/20 to-amber-600/20 blur-2xl" />
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden border-4 border-yellow-600/30 shadow-2xl">
                  <Image
                    src={posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Rating */}
            {movie.vote_average > 0 && (
              <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-yellow-500 uppercase tracking-wider mb-1">Rating</div>
                    <div className="flex items-center gap-2">
                      <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                      <span className="text-3xl font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                      <span className="text-zinc-400 text-sm">/ 10</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 mb-1">Votes</div>
                    <div className="text-sm text-zinc-300">{movie.vote_count.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="bg-zinc-950 p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-2xl space-y-8">
            {/* Title & Meta */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="text-xl text-yellow-500 italic mb-6">&ldquo;{movie.tagline}&rdquo;</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                {movie.release_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                )}
                {movie.runtime > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
                {director && (
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    <span>Dir: {director.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map(genre => (
                <Badge key={genre.id} className="bg-yellow-600/20 text-yellow-500 border-yellow-600/30 hover:bg-yellow-600/30">
                  {genre.name}
                </Badge>
              ))}
            </div>

            {/* Synopsis */}
            <div>
              <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider mb-3">Synopsis</h2>
              <p className="text-zinc-300 leading-relaxed text-lg">
                {movie.overview || 'No overview available.'}
              </p>
            </div>

            {/* Follow Buttons */}
            {isAuthenticated && (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-zinc-800">
                <Button
                  size="lg"
                  onClick={() => isFollowingTheatrical
                    ? onUnfollow(isFollowingBoth ? 'BOTH' : 'THEATRICAL')
                    : onFollow('THEATRICAL')
                  }
                  disabled={followLoading}
                  className={cn(
                    "gap-2",
                    isFollowingTheatrical
                      ? "bg-yellow-600 hover:bg-yellow-700 text-black"
                      : "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700"
                  )}
                >
                  {isFollowingTheatrical ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  <Film className="h-5 w-5" />
                  <span>Theatrical</span>
                </Button>

                <Button
                  size="lg"
                  onClick={() => isFollowingStreaming
                    ? onUnfollow(isFollowingBoth ? 'BOTH' : 'STREAMING')
                    : onFollow('STREAMING')
                  }
                  disabled={followLoading}
                  className={cn(
                    "gap-2",
                    isFollowingStreaming
                      ? "bg-yellow-600 hover:bg-yellow-700 text-black"
                      : "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700"
                  )}
                >
                  {isFollowingStreaming ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  <Tv className="h-5 w-5" />
                  <span>Streaming</span>
                </Button>

                {!isFollowingBoth && !isFollowingTheatrical && !isFollowingStreaming && (
                  <Button
                    size="lg"
                    onClick={() => onFollow('BOTH')}
                    disabled={followLoading}
                    className="gap-2 bg-yellow-600 hover:bg-yellow-700 text-black"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Follow Both</span>
                  </Button>
                )}
              </div>
            )}

            {/* Release Dates */}
            {(movie.unifiedDates.usTheatrical || movie.unifiedDates.streaming) && (
              <div className="grid grid-cols-2 gap-4">
                {movie.unifiedDates.usTheatrical && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="text-xs text-zinc-500 uppercase mb-2">Theatrical</div>
                    <div className="text-white font-semibold">{formatDate(movie.unifiedDates.usTheatrical)}</div>
                  </div>
                )}
                {movie.unifiedDates.streaming && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="text-xs text-zinc-500 uppercase mb-2">Streaming</div>
                    <div className="text-white font-semibold">{formatDate(movie.unifiedDates.streaming)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Trailer */}
            {trailers.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider mb-3">Trailer</h2>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-zinc-800">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailers[currentTrailerIndex].key}`}
                    title={trailers[currentTrailerIndex].name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                {trailers.length > 1 && (
                  <div className="flex items-center justify-between mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentTrailerIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentTrailerIndex === 0}
                      className="text-zinc-400"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-zinc-500">
                      {currentTrailerIndex + 1} / {trailers.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentTrailerIndex(prev => Math.min(trailers.length - 1, prev + 1))}
                      disabled={currentTrailerIndex === trailers.length - 1}
                      className="text-zinc-400"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Cast */}
            {mainCast.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider mb-4">Cast</h2>
                <div className="grid grid-cols-2 gap-3">
                  {mainCast.slice(0, 6).map(actor => (
                    <div key={actor.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                        {actor.profile_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-zinc-600">
                            <Film className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-white truncate">{actor.name}</div>
                        <div className="text-xs text-zinc-500 truncate">{actor.character}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Where to Watch */}
            {usWatchProviders && (usWatchProviders.flatrate?.length || usWatchProviders.rent?.length || usWatchProviders.buy?.length) && (
              <div>
                <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider mb-4">Where to Watch</h2>
                <div className="space-y-3">
                  {usWatchProviders.flatrate && usWatchProviders.flatrate.length > 0 && (
                    <div>
                      <div className="text-sm text-zinc-500 mb-2">Streaming</div>
                      <div className="flex flex-wrap gap-2">
                        {usWatchProviders.flatrate.map(provider => (
                          <div key={provider.provider_id} className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-700">
                            <Image
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {movie.budget > 0 && (
                <div>
                  <div className="text-zinc-500 mb-1">Budget</div>
                  <div className="text-white font-semibold">{formatCurrency(movie.budget)}</div>
                </div>
              )}
              {movie.revenue > 0 && (
                <div>
                  <div className="text-zinc-500 mb-1">Revenue</div>
                  <div className="text-white font-semibold">{formatCurrency(movie.revenue)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Movies - Full Width Section */}
      {movie.similar && movie.similar.results.length > 0 && (
        <div className="bg-black border-t border-zinc-800 p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">More Like This</h2>
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
        </div>
      )}
    </div>
  )
}
