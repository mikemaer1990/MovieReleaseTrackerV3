'use client'

import Image from 'next/image'
import Link from 'next/link'
import { TMDBMovie, UnifiedReleaseDates } from '@/types/movie'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar, Star, Plus, Check, Film, Tv } from 'lucide-react'
import { getPosterUrl } from '@/lib/tmdb-utils'
import { formatDate } from '@/lib/utils'

interface MovieCardProps {
  movie: TMDBMovie
  onFollow?: (movieId: number, followType: 'THEATRICAL' | 'STREAMING' | 'BOTH') => void
  onUnfollow?: (movieId: number, followType: 'THEATRICAL' | 'STREAMING' | 'BOTH') => void
  followTypes?: ('THEATRICAL' | 'STREAMING' | 'BOTH')[]
  loading?: boolean
  unifiedDates?: UnifiedReleaseDates
  className?: string
}

export function MovieCard({ movie, onFollow, onUnfollow, followTypes = [], loading, unifiedDates, className }: MovieCardProps) {
  const posterUrl = getPosterUrl(movie.poster_path)
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null
  
  // Helper function to format dates with TBA fallback
  const formatDateWithFallback = (date: string | null | undefined) => {
    if (!date) return 'TBA'
    try {
      return formatDate(date)
    } catch {
      return 'TBA'
    }
  }
  
  // Helper variables for follow status
  const isFollowingBoth = followTypes.includes('BOTH')
  const isFollowingTheatrical = followTypes.includes('THEATRICAL') || isFollowingBoth
  const isFollowingStreaming = followTypes.includes('STREAMING') || isFollowingBoth
  const isCompletelyFollowed = isFollowingBoth || (followTypes.includes('THEATRICAL') && followTypes.includes('STREAMING'))
  const isNotFollowed = followTypes.length === 0
  
  // Toggle handlers
  const handleTheatricalToggle = () => {
    if (isFollowingTheatrical) {
      // If following "BOTH", we need to unfollow BOTH and follow just STREAMING
      if (isFollowingBoth) {
        onUnfollow?.(movie.id, 'BOTH')
        onFollow?.(movie.id, 'STREAMING')
      } else {
        onUnfollow?.(movie.id, 'THEATRICAL')
      }
    } else {
      onFollow?.(movie.id, 'THEATRICAL')
    }
  }
  
  const handleStreamingToggle = () => {
    if (isFollowingStreaming) {
      // If following "BOTH", we need to unfollow BOTH and follow just THEATRICAL
      if (isFollowingBoth) {
        onUnfollow?.(movie.id, 'BOTH')
        onFollow?.(movie.id, 'THEATRICAL')
      } else {
        onUnfollow?.(movie.id, 'STREAMING')
      }
    } else {
      onFollow?.(movie.id, 'STREAMING')
    }
  }

  return (
    <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full", className)}>
      <div className="relative aspect-[3/4] bg-muted">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <span className="text-muted-foreground">No Image</span>
          </div>
        )}
        
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
            <Star className="h-3 w-3 fill-current text-yellow-400" />
            <span>{movie.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>

      <CardContent className="p-3 flex-grow">
        <h3 className="font-semibold text-lg mb-2 truncate" title={movie.title}>
          {movie.title}
        </h3>
        
        {/* Release Dates - Compact Single Row */}
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center">
            <Film className="h-3 w-3 mr-1 text-yellow-500" />
            <span className="text-foreground font-medium">
              {formatDateWithFallback(unifiedDates?.usTheatrical)}
            </span>
          </div>
          <div className="flex items-center">
            <Tv className="h-3 w-3 mr-1 text-amber-500" />
            <span className="text-foreground font-medium">
              {formatDateWithFallback(unifiedDates?.streaming)}
            </span>
          </div>
        </div>

      </CardContent>

      <CardFooter className="p-3 pt-0 space-y-2 mt-auto">
        <div className="w-full space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <Link href={`/movie/${movie.id}`}>
              View Details
            </Link>
          </Button>

          {onFollow && onUnfollow && (
            <div className="space-y-2">
              {/* Always show individual toggle buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleTheatricalToggle}
                  disabled={loading}
                  className={`flex items-center gap-1.5 transition-colors duration-200 ${
                    isFollowingTheatrical 
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-yellow-500 hover:from-yellow-400 hover:to-amber-400 hover:shadow-sm' 
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-yellow-500 hover:text-yellow-400'
                  }`}
                >
                  {isFollowingTheatrical ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Theater</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      <span>Theater</span>
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleStreamingToggle}
                  disabled={loading}
                  className={`flex items-center gap-1.5 transition-colors duration-200 ${
                    isFollowingStreaming 
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-amber-600 hover:from-amber-500 hover:to-yellow-500 hover:shadow-sm' 
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-yellow-600 hover:text-yellow-500'
                  }`}
                >
                  {isFollowingStreaming ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Streaming</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      <span>Streaming</span>
                    </>
                  )}
                </Button>
              </div>
              
              {/* Follow Both button - only show if not completely followed */}
              {!isCompletelyFollowed && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onFollow(movie.id, 'BOTH')}
                  disabled={loading}
                  className="w-full flex items-center gap-1.5 transition-colors duration-200 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-black border-yellow-500 hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500 hover:shadow-md"
                >
                  <Plus className="h-3 w-3" />
                  <span>Follow Both</span>
                </Button>
              )}
              
              {/* Unfollow Both button - only show if completely followed */}
              {isCompletelyFollowed && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (isFollowingBoth) {
                      onUnfollow(movie.id, 'BOTH')
                    } else {
                      onUnfollow(movie.id, 'THEATRICAL')
                      onUnfollow(movie.id, 'STREAMING')
                    }
                  }}
                  disabled={loading}
                  className="w-full flex items-center gap-1.5 transition-colors duration-200 bg-gradient-to-r from-red-900/30 to-red-800/30 border-red-500 text-red-300 hover:from-red-900/50 hover:to-red-800/50 hover:text-red-200"
                >
                  <span>Unfollow All</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}