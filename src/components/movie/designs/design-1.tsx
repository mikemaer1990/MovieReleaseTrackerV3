'use client'

import React, { useState, useMemo } from 'react'
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
  ChevronRight,
  Calendar
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Design1Props {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  isAuthenticated: boolean
  followTypes: FollowType[]
  followLoading: boolean
  onFollow: (movieId: number, followType: FollowType) => void
  onUnfollow: (movieId: number, followType: FollowType) => void
  onToggleFollow: (movieId: number, followType: FollowType) => void
}

export default function Design1({
  movie,
  isAuthenticated,
  followTypes,
  followLoading,
  onFollow,
  onUnfollow,
  onToggleFollow
}: Design1Props) {
  const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0)
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false)

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
  const mainCast = movie.credits?.cast.slice(0, 12) || []
  const usWatchProviders = movie['watch/providers']?.results?.US

  // Overview truncation logic
  const OVERVIEW_CHAR_LIMIT = 250
  const overviewText = movie.overview || 'No overview available.'
  const isOverviewLong = overviewText.length > OVERVIEW_CHAR_LIMIT
  const displayedOverview = isOverviewLong && !isOverviewExpanded
    ? overviewText.slice(0, OVERVIEW_CHAR_LIMIT) + '...'
    : overviewText

  // Combine and filter similar + recommendations for quality
  const qualityMovies = useMemo(() => {
    const allMovies = [
      ...(movie.similar?.results || []),
      ...(movie.recommendations?.results || [])
    ]

    // Remove duplicates, filter quality, sort by rating
    const uniqueMovies = allMovies
      .filter((m, idx, arr) => arr.findIndex(x => x.id === m.id) === idx) // Remove duplicates
      .filter(m =>
        !m.adult && // No adult content
        m.poster_path && // Must have poster
        m.vote_average >= 5 && // Minimum quality rating
        m.vote_count >= 50 // Minimum vote count
      )
      .sort((a, b) => b.vote_average - a.vote_average) // Best first
      .slice(0, 12) // Top 12

    return uniqueMovies
  }, [movie.similar, movie.recommendations])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Backdrop */}
      <div className="relative w-full">
        {/* Backdrop Image - Reduced height on mobile */}
        {backdropUrl && (
          <div className="relative w-full h-[280px] sm:h-[400px] md:h-[600px]">
            <Image
              src={backdropUrl}
              alt={movie.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
          </div>
        )}

        {/* Hero Content */}
        <div className="container mx-auto px-4">
          <div className={cn(
            "relative flex flex-col md:flex-row gap-8",
            backdropUrl ? "-mt-32 md:-mt-48" : "pt-8"
          )}>

            {/* Poster */}
            {posterUrl && (
              <div className="flex-shrink-0 w-full md:w-80">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl ring-4 ring-primary/20">
                  <Image
                    src={posterUrl}
                    alt={`${movie.title} movie poster`}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Main Info */}
            <div className="flex-1 space-y-5">
              {/* Title & Rating Inline */}
              <div>
                <div className="flex flex-wrap items-start gap-4 mb-3">
                  <h1 className="text-4xl md:text-6xl font-bold flex-1 min-w-0">{movie.title}</h1>

                  {/* Featured Rating Badge - Inline */}
                  {movie.vote_average > 0 && (
                    <div
                      className="flex-shrink-0 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500/40 rounded-lg px-4 py-2"
                      aria-label={`Rating: ${movie.vote_average.toFixed(1)} out of 10 based on ${movie.vote_count.toLocaleString()} votes`}
                    >
                      <div className="flex items-center gap-2">
                        <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                        <div>
                          <div className="text-3xl font-black text-yellow-400 leading-none">
                            {movie.vote_average.toFixed(1)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {movie.vote_count.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {movie.tagline && (
                  <p className="text-xl text-muted-foreground italic mb-4">&ldquo;{movie.tagline}&rdquo;</p>
                )}

                {/* Quick Facts Bar */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground border-l-4 border-primary pl-4 py-2 mb-3">
                  {movie.release_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>
                  )}
                  {movie.runtime > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{formatRuntime(movie.runtime)}</span>
                      </div>
                    </>
                  )}
                  {director && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Film className="h-4 w-4" />
                        <span>{director.name}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map(genre => (
                    <Badge key={genre.id} variant="secondary" className="text-sm">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Overview */}
              <Card className="bg-card/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Overview</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {displayedOverview}
                  </p>
                  {isOverviewLong && (
                    <button
                      onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      aria-expanded={isOverviewExpanded}
                    >
                      {isOverviewExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </CardContent>
              </Card>

              {/* Release Dates */}
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Film className="h-3 w-3 text-yellow-500" />
                        <span>Theatrical</span>
                      </div>
                      <p className="text-sm font-semibold">
                        {movie.unifiedDates.usTheatrical
                          ? formatDate(movie.unifiedDates.usTheatrical)
                          : 'TBA'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Tv className="h-3 w-3 text-amber-500" />
                        <span>Streaming</span>
                      </div>
                      <p className="text-sm font-semibold">
                        {movie.unifiedDates.streaming
                          ? formatDate(movie.unifiedDates.streaming)
                          : 'TBA'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Follow Buttons - Compact on mobile, full on desktop */}
              {isAuthenticated && (
                <div role="group" aria-label="Movie follow options">
                  {/* Mobile: Compact Icon Buttons */}
                  <div className="flex flex-col gap-2 md:hidden">
                    <div className="flex gap-2">
                      <Button
                        size="default"
                        onClick={() => onToggleFollow(movie.id, 'THEATRICAL')}
                        disabled={followLoading}
                        aria-label={isFollowingTheatrical ? `Unfollow ${movie.title} theatrical release` : `Follow ${movie.title} theatrical release`}
                        className={cn(
                          "flex-1 gap-2 transition-all duration-200",
                          isFollowingTheatrical
                            ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400"
                            : "border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/60 hover:bg-yellow-500/10"
                        )}
                        variant={isFollowingTheatrical ? "default" : "outline"}
                      >
                        {isFollowingTheatrical ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                        <Film className="h-4 w-4" aria-hidden="true" />
                        <span className="text-sm">Theater</span>
                      </Button>

                      <Button
                        size="default"
                        onClick={() => onToggleFollow(movie.id, 'STREAMING')}
                        disabled={followLoading}
                        aria-label={isFollowingStreaming ? `Unfollow ${movie.title} streaming release` : `Follow ${movie.title} streaming release`}
                        className={cn(
                          "flex-1 gap-2 transition-all duration-200",
                          isFollowingStreaming
                            ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-black hover:from-amber-500 hover:to-yellow-500"
                            : "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10"
                        )}
                        variant={isFollowingStreaming ? "default" : "outline"}
                      >
                        {isFollowingStreaming ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                        <Tv className="h-4 w-4" aria-hidden="true" />
                        <span className="text-sm">Stream</span>
                      </Button>
                    </div>

                    {!isFollowingBoth && !isFollowingTheatrical && !isFollowingStreaming && (
                      <Button
                        size="default"
                        onClick={() => onFollow(movie.id, 'BOTH')}
                        disabled={followLoading}
                        aria-label={`Follow ${movie.title} for both theatrical and streaming releases`}
                        className="w-full gap-2 transition-all duration-200 bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        <span className="text-sm">Both</span>
                      </Button>
                    )}
                  </div>

                  {/* Desktop: Full Buttons */}
                  <div className="hidden md:flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      onClick={() => onToggleFollow(movie.id, 'THEATRICAL')}
                      disabled={followLoading}
                      aria-label={isFollowingTheatrical ? `Unfollow ${movie.title} theatrical release` : `Follow ${movie.title} theatrical release`}
                      className={cn(
                        "gap-2 transition-all duration-200",
                        isFollowingTheatrical
                          ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 hover:shadow-lg hover:shadow-yellow-500/50"
                          : "border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/60 hover:bg-yellow-500/10 hover:scale-105"
                      )}
                      variant={isFollowingTheatrical ? "default" : "outline"}
                    >
                      {isFollowingTheatrical ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                      <Film className="h-4 w-4" aria-hidden="true" />
                      <span>Theatrical</span>
                    </Button>

                    <Button
                      size="lg"
                      onClick={() => onToggleFollow(movie.id, 'STREAMING')}
                      disabled={followLoading}
                      aria-label={isFollowingStreaming ? `Unfollow ${movie.title} streaming release` : `Follow ${movie.title} streaming release`}
                      className={cn(
                        "gap-2 transition-all duration-200",
                        isFollowingStreaming
                          ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-black hover:from-amber-500 hover:to-yellow-500 hover:shadow-lg hover:shadow-amber-500/50"
                          : "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10 hover:scale-105"
                      )}
                      variant={isFollowingStreaming ? "default" : "outline"}
                    >
                      {isFollowingStreaming ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                      <Tv className="h-4 w-4" aria-hidden="true" />
                      <span>Streaming</span>
                    </Button>

                    {!isFollowingBoth && !isFollowingTheatrical && !isFollowingStreaming && (
                      <Button
                        size="lg"
                        onClick={() => onFollow(movie.id, 'BOTH')}
                        disabled={followLoading}
                        aria-label={`Follow ${movie.title} for both theatrical and streaming releases`}
                        className="gap-2 transition-all duration-200 bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500 hover:shadow-lg hover:shadow-yellow-500/50"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        <span>Follow Both</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 space-y-10 md:space-y-12">
        {/* Key Details Grid - More Compact */}
        <section aria-labelledby="movie-details-heading">
          <h2 id="movie-details-heading" className="text-xl md:text-2xl font-bold mb-4 md:mb-5">Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {movie.budget > 0 && (
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <DollarSign className="h-3 w-3" />
                    <span>Budget</span>
                  </div>
                  <p className="text-sm font-bold">{formatCurrency(movie.budget)}</p>
                </CardContent>
              </Card>
            )}

            {movie.revenue > 0 && (
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <DollarSign className="h-3 w-3" />
                    <span>Revenue</span>
                  </div>
                  <p className="text-sm font-bold">{formatCurrency(movie.revenue)}</p>
                </CardContent>
              </Card>
            )}

            {movie.original_language && (
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Globe className="h-3 w-3" />
                    <span>Language</span>
                  </div>
                  <p className="text-sm font-bold uppercase">{movie.original_language}</p>
                </CardContent>
              </Card>
            )}

            {movie.status && movie.status !== 'Released' && (
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <p className="text-sm font-bold">{movie.status}</p>
                </CardContent>
              </Card>
            )}

            {movie.production_companies.length > 0 && (
              <Card className="col-span-2 md:col-span-4 hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Production</div>
                  <p className="text-sm">{movie.production_companies.map(c => c.name).join(', ')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Trailers - Enhanced for mobile */}
        {trailers.length > 0 && (
          <section aria-labelledby="trailers-heading">
            <h2 id="trailers-heading" className="text-xl md:text-2xl font-bold mb-4 md:mb-5">Trailers</h2>
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black shadow-lg">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${trailers[currentTrailerIndex].key}?modestbranding=1&rel=0&playsinline=1&controls=1&iv_load_policy=3`}
                  title={`${movie.title} - ${trailers[currentTrailerIndex].name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {trailers.length > 1 && (
                  <div className="flex items-center gap-2 w-full sm:w-auto" role="navigation" aria-label="Trailer navigation">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTrailerIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentTrailerIndex === 0}
                      aria-label="Previous trailer"
                      className="flex-1 sm:flex-none"
                    >
                      <ChevronLeft className="h-4 w-4 sm:mr-1" aria-hidden="true" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <span className="text-sm text-muted-foreground whitespace-nowrap px-2" aria-live="polite" aria-atomic="true">
                      {currentTrailerIndex + 1} of {trailers.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTrailerIndex(prev => Math.min(trailers.length - 1, prev + 1))}
                      disabled={currentTrailerIndex === trailers.length - 1}
                      aria-label="Next trailer"
                      className="flex-1 sm:flex-none"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4 sm:ml-1" aria-hidden="true" />
                    </Button>
                  </div>
                )}

                <a
                  href={`https://www.youtube.com/watch?v=${trailers[currentTrailerIndex].key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center"
                >
                  <span>Watch on YouTube</span>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Cast - Enhanced Mobile Scroll */}
        {mainCast.length > 0 && (
          <section aria-labelledby="cast-heading">
            <h2 id="cast-heading" className="text-xl md:text-2xl font-bold mb-4 md:mb-5">Cast</h2>

            {/* Mobile: Horizontal Scroll */}
            <div className="lg:hidden overflow-x-auto -mx-4 px-4 scroll-smooth">
              <div className="flex gap-4 pb-4">
                {mainCast.map(actor => (
                  <div key={actor.id} className="flex-shrink-0 w-36">
                    <Card className="overflow-hidden">
                      <div className="relative aspect-[2/3] bg-muted">
                        {actor.profile_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={`${actor.name} as ${actor.character}`}
                            fill
                            sizes="144px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full" aria-label="No photo available">
                            <Film className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-semibold text-sm truncate">{actor.name}</p>
                        <p className="text-xs text-muted-foreground truncate min-h-[16px]">
                          {actor.character || '\u00A0'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: 8-column Grid */}
            <div className="hidden lg:grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {mainCast.map(actor => (
                <Card key={actor.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative aspect-[2/3] bg-muted">
                    {actor.profile_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={`${actor.name} as ${actor.character}`}
                        fill
                        sizes="(max-width: 1024px) 150px, (max-width: 1280px) 175px, 200px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full" aria-label="No photo available">
                        <Film className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-2">
                    <p className="font-semibold text-xs truncate">{actor.name}</p>
                    <p className="text-xs text-muted-foreground truncate min-h-[16px]">
                      {actor.character || '\u00A0'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Where to Watch */}
        {usWatchProviders && (usWatchProviders.flatrate?.length || usWatchProviders.rent?.length || usWatchProviders.buy?.length) && (
          <section aria-labelledby="watch-providers-heading">
            <h2 id="watch-providers-heading" className="text-xl md:text-2xl font-bold mb-4 md:mb-5">Where to Watch</h2>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-6">
                  {usWatchProviders.flatrate && usWatchProviders.flatrate.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Stream</h3>
                      <div className="flex flex-wrap gap-4">
                        {usWatchProviders.flatrate.map(provider => (
                          <div key={provider.provider_id} className="flex flex-col items-center gap-2 group">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all">
                              <Image
                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                alt={`Stream on ${provider.provider_name}`}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                            <span className="text-xs text-center max-w-[80px] truncate">{provider.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {usWatchProviders.rent && usWatchProviders.rent.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Rent</h3>
                      <div className="flex flex-wrap gap-4">
                        {usWatchProviders.rent.map(provider => (
                          <div key={provider.provider_id} className="flex flex-col items-center gap-2 group">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all">
                              <Image
                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                alt={`Rent on ${provider.provider_name}`}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                            <span className="text-xs text-center max-w-[80px] truncate">{provider.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {usWatchProviders.buy && usWatchProviders.buy.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Buy</h3>
                      <div className="flex flex-wrap gap-4">
                        {usWatchProviders.buy.map(provider => (
                          <div key={provider.provider_id} className="flex flex-col items-center gap-2 group">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all">
                              <Image
                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                alt={`Buy on ${provider.provider_name}`}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                            <span className="text-xs text-center max-w-[80px] truncate">{provider.provider_name}</span>
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

        {/* Similar Movies */}
        {qualityMovies.length >= 3 && (
          <section aria-labelledby="similar-movies-heading">
            <h2 id="similar-movies-heading" className="text-xl md:text-2xl font-bold mb-4 md:mb-5">Similar Movies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {qualityMovies.map(similarMovie => (
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
