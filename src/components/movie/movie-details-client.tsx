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
  DollarSign,
  Globe,
  Check,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface MovieDetailsClientProps {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  isAuthenticated: boolean
  followTypes: FollowType[]
  followLoading: boolean
  onFollow: (movieId: number, followType: FollowType) => void
  onUnfollow: (movieId: number, followType: FollowType) => void
}

export default function MovieDetailsClient({
  movie,
  isAuthenticated,
  followTypes,
  followLoading,
  onFollow,
  onUnfollow
}: MovieDetailsClientProps) {
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format runtime
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Backdrop */}
      <div className="relative w-full">
        {/* Backdrop Image */}
        {backdropUrl && (
          <div className="relative w-full h-[500px] md:h-[600px]">
            <Image
              src={backdropUrl}
              alt={movie.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        )}

        {/* Hero Content */}
        <div className="container mx-auto px-4">
          <div className={cn(
            "relative flex flex-col md:flex-row gap-8",
            backdropUrl ? "-mt-48 md:-mt-64" : "pt-8"
          )}>
            {/* Poster */}
            {posterUrl && (
              <div className="flex-shrink-0 w-full md:w-80">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
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

            {/* Info Section */}
            <div className="flex-1 space-y-6">
              {/* Title and Metadata */}
              <div>
                <h1 className="text-4xl md:text-6xl font-bold mb-2">{movie.title}</h1>
                {movie.tagline && (
                  <p className="text-xl text-muted-foreground italic">{movie.tagline}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-4">
                  {movie.vote_average > 0 && (
                    <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full">
                      <Star className="h-5 w-5 fill-current" />
                      <span className="font-bold text-lg">{movie.vote_average.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({movie.vote_count} votes)</span>
                    </div>
                  )}

                  {movie.runtime > 0 && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>{formatRuntime(movie.runtime)}</span>
                    </div>
                  )}

                  {movie.status && (
                    <Badge variant="outline">{movie.status}</Badge>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {movie.genres.map(genre => (
                    <Badge key={genre.id} variant="secondary">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Release Dates */}
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Film className="h-4 w-4" />
                        <span>Theatrical Release</span>
                      </div>
                      <p className="text-lg font-semibold">
                        {movie.unifiedDates.usTheatrical
                          ? formatDate(movie.unifiedDates.usTheatrical)
                          : 'TBA'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Tv className="h-4 w-4" />
                        <span>Streaming Release</span>
                      </div>
                      <p className="text-lg font-semibold">
                        {movie.unifiedDates.streaming
                          ? formatDate(movie.unifiedDates.streaming)
                          : 'TBA'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Follow Buttons */}
              {isAuthenticated && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => isFollowingTheatrical
                      ? onUnfollow(movie.id, isFollowingBoth ? 'BOTH' : 'THEATRICAL')
                      : onFollow(movie.id, 'THEATRICAL')
                    }
                    disabled={followLoading}
                    className={cn(
                      "flex items-center gap-2",
                      isFollowingTheatrical
                        ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400"
                        : "border-yellow-500 hover:bg-yellow-500/10"
                    )}
                  >
                    {isFollowingTheatrical ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    <Film className="h-5 w-5" />
                    <span>Follow Theatrical</span>
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
                      "flex items-center gap-2",
                      isFollowingStreaming
                        ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-black hover:from-amber-500 hover:to-yellow-500"
                        : "border-amber-600 hover:bg-amber-600/10"
                    )}
                  >
                    {isFollowingStreaming ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    <Tv className="h-5 w-5" />
                    <span>Follow Streaming</span>
                  </Button>

                  {!isFollowingBoth && !isFollowingTheatrical && !isFollowingStreaming && (
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={() => onFollow(movie.id, 'BOTH')}
                      disabled={followLoading}
                      className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-black hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Follow Both
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Synopsis */}
        <section>
          <h2 className="text-3xl font-bold mb-4">Overview</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {movie.overview || 'No overview available.'}
          </p>
        </section>

        {/* Key Info Grid */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {director && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Director</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{director.name}</p>
                </CardContent>
              </Card>
            )}

            {movie.budget > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{formatCurrency(movie.budget)}</p>
                </CardContent>
              </Card>
            )}

            {movie.revenue > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">{formatCurrency(movie.revenue)}</p>
                </CardContent>
              </Card>
            )}

            {movie.original_language && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Original Language
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold uppercase">{movie.original_language}</p>
                </CardContent>
              </Card>
            )}

            {movie.production_companies.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Production Companies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{movie.production_companies.map(c => c.name).join(', ')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Where to Watch */}
        {usWatchProviders && (
          <section>
            <h2 className="text-3xl font-bold mb-6">Where to Watch</h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {usWatchProviders.flatrate && usWatchProviders.flatrate.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Stream</h3>
                      <div className="flex flex-wrap gap-4">
                        {usWatchProviders.flatrate.map(provider => (
                          <div key={provider.provider_id} className="flex flex-col items-center gap-2">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
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
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Rent</h3>
                      <div className="flex flex-wrap gap-4">
                        {usWatchProviders.rent.map(provider => (
                          <div key={provider.provider_id} className="flex flex-col items-center gap-2">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
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
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Buy</h3>
                      <div className="flex flex-wrap gap-4">
                        {usWatchProviders.buy.map(provider => (
                          <div key={provider.provider_id} className="flex flex-col items-center gap-2">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
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
              </CardContent>
            </Card>
          </section>
        )}

        {/* Trailers */}
        {trailers.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6">Trailers</h2>
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
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
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentTrailerIndex + 1} of {trailers.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentTrailerIndex(prev => Math.min(trailers.length - 1, prev + 1))}
                    disabled={currentTrailerIndex === trailers.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Cast */}
        {mainCast.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6">Cast</h2>
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-4">
                {mainCast.map(actor => (
                  <div key={actor.id} className="flex-shrink-0 w-36">
                    <Card className="overflow-hidden">
                      <div className="relative aspect-[2/3] bg-muted">
                        {actor.profile_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-muted-foreground text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-semibold text-sm truncate">{actor.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Similar Movies */}
        {movie.similar && movie.similar.results.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-6">Similar Movies</h2>
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
          </section>
        )}
      </div>
    </div>
  )
}
