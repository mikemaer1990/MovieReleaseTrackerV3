'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TMDBEnhancedMovieDetails, UnifiedReleaseDates, FollowType } from '@/types/movie'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ChevronRight
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Design6Props {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  isAuthenticated: boolean
  followTypes: FollowType[]
  followLoading: boolean
  onFollow: (followType: FollowType) => void
  onUnfollow: (followType: FollowType) => void
}

export default function Design6({
  movie,
  isAuthenticated,
  followTypes,
  followLoading,
  onFollow,
  onUnfollow
}: Design6Props) {
  const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0)

  const isFollowingBoth = followTypes.includes('BOTH')
  const isFollowingTheatrical = followTypes.includes('THEATRICAL') || isFollowingBoth
  const isFollowingStreaming = followTypes.includes('STREAMING') || isFollowingBoth

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null

  const trailers = movie.videos?.results.filter(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  ) || []

  const director = movie.credits?.crew.find(c => c.job === 'Director')
  const mainCast = movie.credits?.cast.slice(0, 8) || []
  const usWatchProviders = movie['watch/providers']?.results?.US

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Hero Section - Backdrop */}
      {backdropUrl && (
        <div className="relative w-full h-64 md:h-80 mb-8">
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      {/* Main Content - Bento Grid */}
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">

          {/* Asymmetric Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">

            {/* Title Card - Spans full width */}
            <Card className="md:col-span-12 overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4">
                  {movie.title}
                </h1>
                {movie.tagline && (
                  <p className="text-xl text-muted-foreground italic">&ldquo;{movie.tagline}&rdquo;</p>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {movie.genres.map(genre => (
                    <Badge key={genre.id} variant="outline" className="bg-primary/10 border-primary/30">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Poster - Left side */}
            <Card className="md:col-span-4 md:row-span-2 overflow-hidden hover:shadow-lg transition-shadow">
              {posterUrl && (
                <div className="relative aspect-[2/3] w-full">
                  <Image
                    src={posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </Card>

            {/* Rating Card */}
            {movie.vote_average > 0 && (
              <Card className="md:col-span-4 overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm">Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                    <div>
                      <div className="text-3xl font-bold">{movie.vote_average.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">{movie.vote_count.toLocaleString()} votes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meta Info Card */}
            <Card className="md:col-span-4 overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-sm">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {movie.release_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                )}
                {movie.runtime > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
                {director && (
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{director.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Synopsis Card */}
            <Card className="md:col-span-8 overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {movie.overview || 'No overview available.'}
                </p>
              </CardContent>
            </Card>

            {/* Release Dates */}
            {(movie.unifiedDates.usTheatrical || movie.unifiedDates.streaming) && (
              <Card className="md:col-span-4 overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm">Release Dates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {movie.unifiedDates.usTheatrical && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Theatrical</div>
                      <div className="font-semibold">{formatDate(movie.unifiedDates.usTheatrical)}</div>
                    </div>
                  )}
                  {movie.unifiedDates.streaming && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Streaming</div>
                      <div className="font-semibold">{formatDate(movie.unifiedDates.streaming)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Follow Buttons */}
            {isAuthenticated && (
              <Card className="md:col-span-8 overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3">
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
                          ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400"
                          : ""
                      )}
                      variant={isFollowingTheatrical ? "default" : "outline"}
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
                          ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-black hover:from-amber-500 hover:to-yellow-500"
                          : ""
                      )}
                      variant={isFollowingStreaming ? "default" : "outline"}
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
                        className="gap-2 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-black hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Follow Both</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trailer */}
            {trailers.length > 0 && (
              <Card className="md:col-span-8 overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm">Trailer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video bg-black rounded overflow-hidden">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailers[currentTrailerIndex].key}`}
                      title={trailers[currentTrailerIndex].name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                  {trailers.length > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentTrailerIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentTrailerIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentTrailerIndex + 1} / {trailers.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentTrailerIndex(prev => Math.min(trailers.length - 1, prev + 1))}
                        disabled={currentTrailerIndex === trailers.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Box Office */}
            {(movie.budget > 0 || movie.revenue > 0) && (
              <Card className="md:col-span-4 overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm">Box Office</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {movie.budget > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Budget</div>
                      <div className="font-semibold">{formatCurrency(movie.budget)}</div>
                    </div>
                  )}
                  {movie.revenue > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                      <div className="font-semibold">{formatCurrency(movie.revenue)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cast Grid */}
          {mainCast.length > 0 && (
            <Card className="mb-4 overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Cast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
                  {mainCast.map(actor => (
                    <div key={actor.id} className="text-center">
                      <div className="relative w-full aspect-square rounded-full overflow-hidden bg-muted mb-2">
                        {actor.profile_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Film className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-semibold truncate">{actor.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{actor.character}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Where to Watch */}
          {usWatchProviders && (usWatchProviders.flatrate?.length || usWatchProviders.rent?.length) && (
            <Card className="mb-4 overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Where to Watch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {usWatchProviders.flatrate && usWatchProviders.flatrate.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Streaming</div>
                    <div className="flex flex-wrap gap-2">
                      {usWatchProviders.flatrate.map(provider => (
                        <div key={provider.provider_id} className="relative w-12 h-12 rounded overflow-hidden border border-border">
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
              </CardContent>
            </Card>
          )}

          {/* Similar Movies */}
          {movie.similar && movie.similar.results.length > 0 && (
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>More Like This</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
