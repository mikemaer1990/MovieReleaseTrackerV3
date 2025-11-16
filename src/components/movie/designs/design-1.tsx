'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TMDBEnhancedMovieDetails, UnifiedReleaseDates, FollowType, MovieRatings } from '@/types/movie'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MovieCard } from '@/components/movie/movie-card'
import { MovieRatingsDisplay } from '@/components/movie/movie-ratings'
import { ParticleBurst } from '@/components/ui/particle-burst'
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
  Calendar,
  ExternalLink,
  X,
  Bell,
  BellRing
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Design1Props {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  ratings: MovieRatings
  isAuthenticated: boolean
  followTypes: FollowType[]
  followLoading: boolean
  onFollow: (movieId: number, followType: FollowType) => void
  onUnfollow: (movieId: number, followType: FollowType) => void
  onToggleFollow: (movieId: number, followType: FollowType) => void
}

export default function Design1({
  movie,
  ratings,
  isAuthenticated,
  followTypes,
  followLoading,
  onFollow,
  onUnfollow,
  onToggleFollow
}: Design1Props) {
  const [currentTrailerIndex, setCurrentTrailerIndex] = useState(0)
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false)
  const [burstTheatrical, setBurstTheatrical] = useState(false)
  const [burstStreaming, setBurstStreaming] = useState(false)
  const [burstBoth, setBurstBoth] = useState(false)

  const isFollowingBoth = followTypes.includes('BOTH')
  const isFollowingTheatrical = followTypes.includes('THEATRICAL') || isFollowingBoth
  const isFollowingStreaming = followTypes.includes('STREAMING') || isFollowingBoth

  // Calculate combined rating from all available sources
  const combinedRating = useMemo(() => {
    const scores: number[] = []

    // TMDB (already on 10-point scale)
    if (ratings.tmdb?.score) {
      scores.push(ratings.tmdb.score)
    }

    // IMDb (format: "8.5/10" - convert to number)
    if (ratings.imdb?.score) {
      const imdbScore = parseFloat(ratings.imdb.score.split('/')[0])
      if (!isNaN(imdbScore)) {
        scores.push(imdbScore)
      }
    }

    // Rotten Tomatoes (format: "85%" - convert to 10-point scale)
    if (ratings.rottenTomatoes?.score) {
      const rtScore = parseFloat(ratings.rottenTomatoes.score.replace('%', ''))
      if (!isNaN(rtScore)) {
        scores.push(rtScore / 10)
      }
    }

    // Metacritic (format: "75/100" - convert to 10-point scale)
    if (ratings.metacritic?.score) {
      const metaScore = parseFloat(ratings.metacritic.score.split('/')[0])
      if (!isNaN(metaScore)) {
        scores.push(metaScore / 10)
      }
    }

    // Calculate average
    if (scores.length === 0) return null
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return average
  }, [ratings])

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

  // Check if streaming is currently available
  const isStreamingAvailable = useMemo(() => {
    if (!movie.unifiedDates.streaming) return false
    const streamingDate = new Date(movie.unifiedDates.streaming)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to midnight for date-only comparison
    return streamingDate <= today
  }, [movie.unifiedDates.streaming])

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

  const writers = movie.credits?.crew.filter(c =>
    c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Story'
  ).slice(0, 3) || []

  // Haptic feedback helper
  const triggerHaptic = (isFollowing: boolean) => {
    if ('vibrate' in navigator) {
      if (isFollowing) {
        // Following: single strong vibration
        navigator.vibrate(50)
      } else {
        // Unfollowing: double tap pattern
        navigator.vibrate([30, 20, 30])
      }
    }
  }

  // Enhanced toggle with animation
  const handleAnimatedToggle = (followType: FollowType) => {
    const isCurrentlyFollowing =
      followType === 'THEATRICAL' ? isFollowingTheatrical :
      followType === 'STREAMING' ? isFollowingStreaming :
      isFollowingBoth

    // Trigger haptic feedback
    triggerHaptic(!isCurrentlyFollowing)

    // Trigger particle burst
    if (followType === 'THEATRICAL') {
      setBurstTheatrical(false) // Reset first
      setTimeout(() => setBurstTheatrical(true), 10) // Then trigger
      setTimeout(() => setBurstTheatrical(false), 900) // Clear after animation completes
    } else if (followType === 'STREAMING') {
      setBurstStreaming(false)
      setTimeout(() => setBurstStreaming(true), 10)
      setTimeout(() => setBurstStreaming(false), 900)
    }

    // Call the actual toggle function
    onToggleFollow(movie.id, followType)
  }

  // Enhanced follow for "Both" button
  const handleAnimatedFollow = () => {
    triggerHaptic(true)
    setBurstBoth(false)
    setTimeout(() => setBurstBoth(true), 10)
    setTimeout(() => setBurstBoth(false), 900)
    onFollow(movie.id, 'BOTH')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Backdrop Section */}
      {backdropUrl && (
        <div className="relative w-full h-[200px] sm:h-[280px] md:h-[350px]">
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            sizes="100vw"
            className="object-cover object-[center_30%]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/60 to-zinc-950" />

          {/* Title Overlay on Backdrop */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="container mx-auto">
              <div className="flex items-end gap-4 flex-wrap">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                  {movie.title}
                </h1>
                {movie.release_date && (
                  <span className="text-xl sm:text-2xl text-zinc-300 pb-1">
                    ({new Date(movie.release_date).getFullYear()})
                  </span>
                )}
                {movie.vote_average > 0 && (
                  <div className="ml-auto bg-zinc-900/80 backdrop-blur-md border border-yellow-500/30 rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold text-yellow-400">{movie.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Sidebar Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

          {/* LEFT SIDEBAR */}
          <div className="space-y-4">
            {/* Poster */}
            {posterUrl && (
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl">
                <Image
                  src={posterUrl}
                  alt={`${movie.title} movie poster`}
                  fill
                  sizes="320px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Rating Box */}
            {combinedRating !== null && (
              <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-lg p-4">
                <div className="text-xs text-zinc-400 uppercase tracking-wide mb-3">Combined Rating</div>
                <div className="flex items-center gap-3">
                  <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                  <div>
                    <div className="text-3xl font-bold text-zinc-100">
                      {combinedRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Average of available ratings
                    </div>
                  </div>
                </div>
              </div>
            )}


            {/* Details Widget - Compact Sidebar Style */}
            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Details</h3>

              {movie.runtime > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Runtime</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-zinc-200">{formatRuntime(movie.runtime)}</span>
                  </div>
                </div>
              )}

              {movie.status && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-zinc-200">{movie.status}</span>
                  </div>
                </div>
              )}

              {movie.original_language && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Language</div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-zinc-200 uppercase">{movie.original_language}</span>
                  </div>
                </div>
              )}

              {movie.unifiedDates.usTheatrical && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Theatrical Release</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-zinc-200">{formatDate(movie.unifiedDates.usTheatrical)}</span>
                  </div>
                </div>
              )}

              {movie.unifiedDates.streaming && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Streaming Release</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-zinc-200">{formatDate(movie.unifiedDates.streaming)}</span>
                  </div>
                </div>
              )}

              {movie.budget > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Budget</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-zinc-200">{formatCurrency(movie.budget)}</span>
                  </div>
                </div>
              )}

              {movie.revenue > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Box Office</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-zinc-200">{formatCurrency(movie.revenue)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="space-y-6">
            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map(genre => (
                <Badge key={genre.id} variant="secondary" className="bg-zinc-800/60 text-zinc-200 border-zinc-700 backdrop-blur-sm">
                  {genre.name}
                </Badge>
              ))}
            </div>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-lg italic text-zinc-400 border-l-4 border-yellow-500 pl-4 py-1">
                &ldquo;{movie.tagline}&rdquo;
              </p>
            )}

            {/* Multi-Source Ratings */}
            <MovieRatingsDisplay ratings={ratings} />

            {/* Follow Buttons - Pill Style */}
            {isAuthenticated && !isStreamingAvailable && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAnimatedToggle('THEATRICAL')}
                  disabled={followLoading}
                  className={cn(
                    "group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 cursor-pointer overflow-visible active:scale-95",
                    isFollowingTheatrical
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
                      : "bg-zinc-800/60 text-zinc-200 border border-zinc-700 hover:bg-zinc-700/60"
                  )}
                >
                  <ParticleBurst active={burstTheatrical} color="yellow" />

                  {/* Icon with rotate & morph animation */}
                  <div className="relative w-3.5 h-3.5">
                    {isFollowingTheatrical ? (
                      <>
                        <Check className="absolute inset-0 h-3.5 w-3.5 transition-all duration-300 group-hover:opacity-0 group-hover:rotate-90 group-hover:scale-75" />
                        <X className="absolute inset-0 h-3.5 w-3.5 transition-all duration-300 opacity-0 -rotate-90 scale-75 group-hover:opacity-100 group-hover:rotate-0 group-hover:scale-100" />
                      </>
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <Film className="h-3.5 w-3.5" />

                  {/* Text with transition */}
                  <span className="relative">
                    <span className="transition-opacity duration-300 group-hover:opacity-0">Theatrical</span>
                    <span className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      {isFollowingTheatrical ? 'Unfollow' : 'Theatrical'}
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => handleAnimatedToggle('STREAMING')}
                  disabled={followLoading}
                  className={cn(
                    "group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 cursor-pointer overflow-visible active:scale-95",
                    isFollowingStreaming
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50"
                      : "bg-zinc-800/60 text-zinc-200 border border-zinc-700 hover:bg-zinc-700/60"
                  )}
                >
                  <ParticleBurst active={burstStreaming} color="amber" />

                  {/* Icon with rotate & morph animation */}
                  <div className="relative w-3.5 h-3.5">
                    {isFollowingStreaming ? (
                      <>
                        <Check className="absolute inset-0 h-3.5 w-3.5 transition-all duration-300 group-hover:opacity-0 group-hover:rotate-90 group-hover:scale-75" />
                        <X className="absolute inset-0 h-3.5 w-3.5 transition-all duration-300 opacity-0 -rotate-90 scale-75 group-hover:opacity-100 group-hover:rotate-0 group-hover:scale-100" />
                      </>
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <Tv className="h-3.5 w-3.5" />

                  {/* Text with transition */}
                  <span className="relative">
                    <span className="transition-opacity duration-300 group-hover:opacity-0">Streaming</span>
                    <span className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      {isFollowingStreaming ? 'Unfollow' : 'Streaming'}
                    </span>
                  </span>
                </button>

                {!isFollowingBoth && !isFollowingTheatrical && !isFollowingStreaming && (
                  <button
                    onClick={handleAnimatedFollow}
                    disabled={followLoading}
                    className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer overflow-visible bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/40 hover:from-yellow-500/30 hover:to-amber-500/30 active:scale-95"
                  >
                    <ParticleBurst active={burstBoth} color="yellow" />
                    <Plus className="h-3.5 w-3.5" />
                    <span>Both</span>
                  </button>
                )}
              </div>
            )}

            {/* Where to Watch - Pill Style */}
            {isStreamingAvailable && (usWatchProviders && (usWatchProviders.flatrate?.length || usWatchProviders.rent?.length || usWatchProviders.buy?.length) || followTypes.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {usWatchProviders && (usWatchProviders.flatrate?.length || usWatchProviders.rent?.length || usWatchProviders.buy?.length) && (
                  <a
                    href={usWatchProviders.link || `https://www.themoviedb.org/movie/${movie.id}/watch`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Where to Watch</span>
                  </a>
                )}
                {isAuthenticated && followTypes.length > 0 && (
                  <button
                    onClick={() => {
                      if (isFollowingBoth) {
                        onUnfollow(movie.id, 'BOTH')
                      } else {
                        if (isFollowingTheatrical) onUnfollow(movie.id, 'THEATRICAL')
                        if (isFollowingStreaming) onUnfollow(movie.id, 'STREAMING')
                      }
                    }}
                    disabled={followLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer bg-zinc-800/60 text-zinc-300 border border-zinc-700 hover:bg-zinc-700/60"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Unfollow</span>
                  </button>
                )}
              </div>
            )}

            {/* Plot Summary */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-lg p-5">
              <h2 className="text-xl font-bold mb-3 text-zinc-100">Plot Summary</h2>
              <p className="text-zinc-300 leading-relaxed">
                {displayedOverview}
              </p>
              {isOverviewLong && (
                <button
                  onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                  className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors mt-3 cursor-pointer"
                >
                  {isOverviewExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            {/* Credits Table - IMDb Style */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-lg overflow-hidden">
              <div className="divide-y divide-zinc-800">
                {director && (
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 p-4">
                    <div className="text-sm font-semibold text-zinc-400">Director</div>
                    <div className="text-sm text-zinc-200">{director.name}</div>
                  </div>
                )}

                {writers.length > 0 && (
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 p-4">
                    <div className="text-sm font-semibold text-zinc-400">
                      {writers.length > 1 ? 'Writers' : 'Writer'}
                    </div>
                    <div className="text-sm text-zinc-200">
                      {writers.map(w => w.name).join(', ')}
                    </div>
                  </div>
                )}

                {movie.production_companies.length > 0 && (
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 p-4">
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
                <h2 className="text-xl font-bold mb-4 text-zinc-100">Videos</h2>
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-zinc-800">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${trailers[currentTrailerIndex].key}?modestbranding=1&rel=0&playsinline=1&controls=1`}
                      title={`${movie.title} - ${trailers[currentTrailerIndex].name}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                    />
                  </div>

                  {trailers.length > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentTrailerIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentTrailerIndex === 0}
                        className="bg-zinc-900/60 border-zinc-700 hover:bg-zinc-800 backdrop-blur-sm"
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
                        className="bg-zinc-900/60 border-zinc-700 hover:bg-zinc-800 backdrop-blur-sm"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cast - IMDb Table Style */}
            {mainCast.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-zinc-100">Cast</h2>
                <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-lg overflow-hidden">
                  <div className="divide-y divide-zinc-800">
                    {mainCast.map(actor => (
                      <div key={actor.id} className="grid grid-cols-[70px_1fr] sm:grid-cols-[80px_1fr] gap-3 sm:gap-4 p-3 hover:bg-zinc-800/30 transition-colors">
                        <div className="relative aspect-[2/3] rounded overflow-hidden bg-zinc-800">
                          {actor.profile_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                              alt={actor.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Film className="h-6 w-6 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                          <div className="font-semibold text-sm text-zinc-200 truncate">{actor.name}</div>
                          <div className="text-sm text-zinc-400 truncate">
                            {actor.character ? `as ${actor.character}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Similar Movies */}
            {qualityMovies.length >= 3 && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-zinc-100">More Like This</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
