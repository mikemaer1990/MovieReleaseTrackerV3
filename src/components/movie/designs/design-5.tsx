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
  Zap
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Design5Props {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  isAuthenticated: boolean
  followTypes: FollowType[]
  followLoading: boolean
  onFollow: (followType: FollowType) => void
  onUnfollow: (followType: FollowType) => void
}

export default function Design5({
  movie,
  isAuthenticated,
  followTypes,
  followLoading,
  onFollow,
  onUnfollow
}: Design5Props) {
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
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-orange-950/30 to-zinc-950 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/15 via-transparent to-transparent animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-orange-900/15 via-transparent to-transparent animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Backdrop with overlay */}
      {backdropUrl && (
        <div className="absolute inset-0 opacity-10">
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 md:px-8 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Title with Subtle Glow */}
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 mb-4 drop-shadow-[0_0_25px_rgba(251,146,60,0.3)]">
              {movie.title}
            </h1>
            {movie.tagline && (
              <p className="text-xl text-amber-300/70 italic">{movie.tagline}</p>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
            {/* Left Sidebar - Glassmorphism Cards */}
            <div className="space-y-6">
              {/* Poster with Glow */}
              {posterUrl && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition duration-300 animate-pulse" />
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-amber-600/25">
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

              {/* Rating - Glassmorphism */}
              {movie.vote_average > 0 && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                  <div className="relative bg-black/40 backdrop-blur-xl border border-yellow-400/30 rounded-xl p-6 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                    <div className="flex items-center gap-4">
                      <Star className="h-10 w-10 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                      <div>
                        <div className="text-4xl font-bold text-yellow-400">{movie.vote_average.toFixed(1)}</div>
                        <div className="text-sm text-yellow-400/70">{movie.vote_count.toLocaleString()} votes</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats - Glassmorphism */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-700 to-orange-700 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
                <div className="relative bg-black/40 backdrop-blur-xl border border-amber-600/20 rounded-xl p-6 space-y-4 shadow-[0_0_15px_rgba(217,119,6,0.15)]">
                  {movie.runtime > 0 && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <div>
                        <div className="text-xs text-amber-500/60 uppercase">Runtime</div>
                        <div className="text-white font-semibold">{formatRuntime(movie.runtime)}</div>
                      </div>
                    </div>
                  )}
                  {movie.release_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-xs text-orange-500/60 uppercase">Year</div>
                        <div className="text-white font-semibold">{new Date(movie.release_date).getFullYear()}</div>
                      </div>
                    </div>
                  )}
                  {director && (
                    <div className="flex items-center gap-3">
                      <Film className="h-5 w-5 text-amber-500" />
                      <div>
                        <div className="text-xs text-amber-500/60 uppercase">Director</div>
                        <div className="text-white font-semibold">{director.name}</div>
                      </div>
                    </div>
                  )}
                  {movie.original_language && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-xs text-orange-500/60 uppercase">Language</div>
                        <div className="text-white font-semibold uppercase">{movie.original_language}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Budget/Revenue - Glassmorphism */}
              {(movie.budget > 0 || movie.revenue > 0) && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-300" />
                  <div className="relative bg-black/40 backdrop-blur-xl border border-green-400/30 rounded-xl p-6 space-y-3 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                    {movie.budget > 0 && (
                      <div>
                        <div className="text-xs text-green-400/60 uppercase mb-1">Budget</div>
                        <div className="text-white font-bold">{formatCurrency(movie.budget)}</div>
                      </div>
                    )}
                    {movie.revenue > 0 && (
                      <div>
                        <div className="text-xs text-emerald-400/60 uppercase mb-1">Revenue</div>
                        <div className="text-white font-bold">{formatCurrency(movie.revenue)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Content */}
            <div className="space-y-8">
              {/* Genres with Subtle Pills */}
              <div className="flex flex-wrap gap-3">
                {movie.genres.map(genre => (
                  <div key={genre.id} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-700 to-orange-700 rounded-full blur opacity-40 group-hover:opacity-65 transition duration-300" />
                    <Badge className="relative bg-black/60 backdrop-blur-xl border-amber-600/30 text-amber-400 px-4 py-2 text-sm font-semibold">
                      {genre.name}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Synopsis - Glassmorphism */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-700 via-amber-700 to-orange-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
                <div className="relative bg-black/40 backdrop-blur-xl border border-orange-600/20 rounded-2xl p-8 shadow-[0_0_20px_rgba(234,88,12,0.15)]">
                  <h2 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                    <Zap className="h-6 w-6" />
                    Overview
                  </h2>
                  <p className="text-lg text-white/90 leading-relaxed">
                    {movie.overview || 'No overview available.'}
                  </p>
                </div>
              </div>

              {/* Release Dates - Glassmorphism */}
              {(movie.unifiedDates.usTheatrical || movie.unifiedDates.streaming) && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-700 to-orange-700 rounded-2xl blur opacity-30 group-hover:opacity-45 transition duration-300" />
                  <div className="relative bg-black/40 backdrop-blur-xl border border-amber-600/20 rounded-2xl p-6 shadow-[0_0_15px_rgba(217,119,6,0.15)]">
                    <div className="grid grid-cols-2 gap-6">
                      {movie.unifiedDates.usTheatrical && (
                        <div>
                          <div className="flex items-center gap-2 text-amber-500/80 mb-2">
                            <Film className="h-5 w-5" />
                            <span className="text-xs uppercase font-semibold">Theatrical</span>
                          </div>
                          <div className="text-xl font-bold text-white">
                            {formatDate(movie.unifiedDates.usTheatrical)}
                          </div>
                        </div>
                      )}
                      {movie.unifiedDates.streaming && (
                        <div>
                          <div className="flex items-center gap-2 text-orange-500/80 mb-2">
                            <Tv className="h-5 w-5" />
                            <span className="text-xs uppercase font-semibold">Streaming</span>
                          </div>
                          <div className="text-xl font-bold text-white">
                            {formatDate(movie.unifiedDates.streaming)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Trailer - Glassmorphism */}
              {trailers.length > 0 && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-700 rounded-2xl blur-xl opacity-35 group-hover:opacity-55 transition duration-300" />
                  <div className="relative bg-black/40 backdrop-blur-xl border border-amber-600/25 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(217,119,6,0.2)]">
                    <div className="relative aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${trailers[currentTrailerIndex].key}`}
                        title={trailers[currentTrailerIndex].name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                    {trailers.length > 1 && (
                      <div className="flex items-center justify-between p-4 bg-black/60">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentTrailerIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentTrailerIndex === 0}
                          className="text-amber-500 hover:text-amber-400"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-amber-400">
                          {currentTrailerIndex + 1} / {trailers.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentTrailerIndex(prev => Math.min(trailers.length - 1, prev + 1))}
                          disabled={currentTrailerIndex === trailers.length - 1}
                          className="text-amber-500 hover:text-amber-400"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Follow Buttons - Neon Style */}
              {isAuthenticated && (
                <div className="flex flex-wrap gap-4">
                  <Button
                    size="lg"
                    onClick={() => isFollowingTheatrical
                      ? onUnfollow(isFollowingBoth ? 'BOTH' : 'THEATRICAL')
                      : onFollow('THEATRICAL')
                    }
                    disabled={followLoading}
                    className={cn(
                      "relative gap-2 font-bold group",
                      isFollowingTheatrical
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-[0_0_15px_rgba(217,119,6,0.4)] hover:shadow-[0_0_20px_rgba(217,119,6,0.6)]"
                        : "bg-black/60 backdrop-blur-xl border-2 border-amber-600/40 text-amber-400 hover:border-amber-500 hover:text-amber-300"
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
                      "relative gap-2 font-bold",
                      isFollowingStreaming
                        ? "bg-gradient-to-r from-orange-600 to-amber-700 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)] hover:shadow-[0_0_20px_rgba(234,88,12,0.6)]"
                        : "bg-black/60 backdrop-blur-xl border-2 border-orange-600/40 text-orange-400 hover:border-orange-500 hover:text-orange-300"
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
                      className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white font-bold shadow-[0_0_18px_rgba(217,119,6,0.4)] hover:shadow-[0_0_25px_rgba(217,119,6,0.6)] gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Follow Both</span>
                    </Button>
                  )}
                </div>
              )}

              {/* Cast - Glassmorphism Grid */}
              {mainCast.length > 0 && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-700 to-amber-700 rounded-2xl blur opacity-20 group-hover:opacity-35 transition duration-300" />
                  <div className="relative bg-black/40 backdrop-blur-xl border border-orange-600/20 rounded-2xl p-6 shadow-[0_0_15px_rgba(234,88,12,0.15)]">
                    <h3 className="text-xl font-bold text-orange-400 mb-4">Cast</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {mainCast.map(actor => (
                        <div key={actor.id} className="text-center space-y-2">
                          <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-amber-600/25 shadow-[0_0_12px_rgba(217,119,6,0.2)]">
                            {actor.profile_path ? (
                              <Image
                                src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                                alt={actor.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-orange-900/40 text-orange-500">
                                <Film className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-white truncate">{actor.name}</div>
                            <div className="text-xs text-orange-400/60 truncate">{actor.character}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Where to Watch - Glassmorphism */}
              {usWatchProviders && (usWatchProviders.flatrate?.length || usWatchProviders.rent?.length || usWatchProviders.buy?.length) && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-700 to-orange-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
                  <div className="relative bg-black/40 backdrop-blur-xl border border-amber-600/20 rounded-2xl p-6 shadow-[0_0_15px_rgba(217,119,6,0.15)]">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">Where to Watch</h3>
                    <div className="space-y-4">
                      {usWatchProviders.flatrate && usWatchProviders.flatrate.length > 0 && (
                        <div>
                          <div className="text-sm text-amber-500/70 mb-2">Streaming</div>
                          <div className="flex flex-wrap gap-3">
                            {usWatchProviders.flatrate.map(provider => (
                              <div key={provider.provider_id} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-600/25 shadow-[0_0_12px_rgba(217,119,6,0.2)] hover:shadow-[0_0_18px_rgba(217,119,6,0.35)] transition">
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
                      {usWatchProviders.rent && usWatchProviders.rent.length > 0 && (
                        <div>
                          <div className="text-sm text-orange-500/70 mb-2">Rent</div>
                          <div className="flex flex-wrap gap-3">
                            {usWatchProviders.rent.map(provider => (
                              <div key={provider.provider_id} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-orange-600/25 shadow-[0_0_12px_rgba(234,88,12,0.2)] hover:shadow-[0_0_18px_rgba(234,88,12,0.35)] transition">
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
                      {usWatchProviders.buy && usWatchProviders.buy.length > 0 && (
                        <div>
                          <div className="text-sm text-orange-500/70 mb-2">Buy</div>
                          <div className="flex flex-wrap gap-3">
                            {usWatchProviders.buy.map(provider => (
                              <div key={provider.provider_id} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-orange-600/25 shadow-[0_0_12px_rgba(234,88,12,0.2)] hover:shadow-[0_0_18px_rgba(234,88,12,0.35)] transition">
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
                </div>
              )}

              {/* Production Info - Glassmorphism */}
              {(movie.production_companies.length > 0 || movie.status) && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-zinc-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300" />
                  <div className="relative bg-black/40 backdrop-blur-xl border border-slate-400/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(100,116,139,0.2)]">
                    <div className="space-y-3 text-sm">
                      {movie.production_companies.length > 0 && (
                        <div>
                          <div className="text-xs uppercase text-slate-400 mb-1">Production</div>
                          <div className="text-white">{movie.production_companies.map(c => c.name).join(', ')}</div>
                        </div>
                      )}
                      {movie.status && (
                        <div>
                          <div className="text-xs uppercase text-slate-400 mb-1">Status</div>
                          <div className="text-white">{movie.status}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Similar Movies */}
          {movie.similar && movie.similar.results.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 mb-6">
                More Like This
              </h2>
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
