'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Check } from 'lucide-react'
import { MovieWithDates, FollowType } from '@/types/movie'
import { useFollows, useMovieFollowStatus } from '@/hooks/use-follows'
import { getBackdropUrl, getPosterUrl } from '@/lib/tmdb-utils'

interface NetflixFABCardProps {
  movie: MovieWithDates
}

// Format date to include year (e.g., "Dec 19, 2025")
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'TBA'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return 'TBA'
  }
}

export default function NetflixFABCard({ movie }: NetflixFABCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFollowTypes, setLocalFollowTypes] = useState<FollowType[]>([])
  const [error, setError] = useState<string | null>(null)
  const { followMovie, unfollowMovie, loading: followLoading } = useFollows()
  const { followingTypes, loading: statusLoading, refreshStatus } = useMovieFollowStatus(movie.id)

  // Sync local state with real state when real state changes
  useEffect(() => {
    setLocalFollowTypes(followingTypes)
  }, [followingTypes])

  // Always use local state for display (gets updated immediately)
  const displayFollowTypes = localFollowTypes

  const toggleFollow = async (type: FollowType) => {
    // Clear any previous errors
    setError(null)

    // Optimistic update - update UI immediately
    const isCurrentlyFollowing = localFollowTypes.includes(type)
    const newLocalTypes = isCurrentlyFollowing
      ? localFollowTypes.filter(t => t !== type)  // Remove if already following
      : [...localFollowTypes, type]               // Add if not following

    setLocalFollowTypes(newLocalTypes)

    try {
      if (followingTypes.includes(type)) {
        await unfollowMovie(movie.id, type)
      } else {
        await followMovie(movie.id, type)
      }
      // Success - local state is already updated, no need to refresh
    } catch (error) {
      // Error - revert local state and show error
      setLocalFollowTypes(localFollowTypes)
      setError('Failed to update follow status. Please try again.')
      console.error('Error toggling follow:', error)

      // Auto-clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
    }
  }

  const getMainButtonContent = () => {
    if (displayFollowTypes.length === 2) {
      return <Check className="h-5 w-5" />
    } else if (displayFollowTypes.length === 1) {
      return displayFollowTypes.includes('THEATRICAL') ? '🎬' : '📺'
    } else {
      return <Plus className="h-5 w-5" />
    }
  }

  const getMainButtonColor = () => {
    if (displayFollowTypes.length === 2) {
      return 'bg-green-600 hover:bg-green-700'
    } else if (displayFollowTypes.includes('THEATRICAL')) {
      return 'bg-yellow-500 hover:bg-yellow-600'
    } else if (displayFollowTypes.includes('STREAMING')) {
      return 'bg-yellow-500 hover:bg-yellow-600'
    } else {
      return 'bg-yellow-500 hover:bg-yellow-600'
    }
  }

  const backdropUrl = getBackdropUrl(movie.backdrop_path, 'w1280')
  const fallbackPosterUrl = getPosterUrl(movie.poster_path)

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all relative group bg-black">
      <div className="relative aspect-[16/9] bg-black">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
            className="object-cover"
          />
        ) : fallbackPosterUrl ? (
          <Image
            src={fallbackPosterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
            No Image
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Netflix-style gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* FAB */}
        <div className="absolute top-4 right-4 z-10">
          {/* Expanded options */}
          {isExpanded && (
            <div className="absolute top-16 right-0 space-y-3 animate-in slide-in-from-top">
              <div className="flex items-center gap-3">
                <span className="text-white text-sm bg-black/80 px-3 py-1 rounded-full whitespace-nowrap font-medium">
                  Theater Release
                </span>
                <Button
                  size="sm"
                  onClick={() => toggleFollow('THEATRICAL')}
                  disabled={followLoading || statusLoading}
                  className={`w-12 h-12 rounded-full p-0 shadow-xl border-2 border-white/20 ${
                    displayFollowTypes.includes('THEATRICAL')
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {displayFollowTypes.includes('THEATRICAL') ? <Check className="h-5 w-5" /> : '🎬'}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-sm bg-black/80 px-3 py-1 rounded-full whitespace-nowrap font-medium">
                  Streaming Release
                </span>
                <Button
                  size="sm"
                  onClick={() => toggleFollow('STREAMING')}
                  disabled={followLoading || statusLoading}
                  className={`w-12 h-12 rounded-full p-0 shadow-xl border-2 border-white/20 ${
                    displayFollowTypes.includes('STREAMING')
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {displayFollowTypes.includes('STREAMING') ? <Check className="h-5 w-5" /> : '📺'}
                </Button>
              </div>
            </div>
          )}

          {/* Main FAB button */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={statusLoading}
            className={`w-14 h-14 rounded-full p-0 text-white shadow-xl border-2 border-white/20 transition-all hover:scale-110 ${getMainButtonColor()} disabled:opacity-50`}
          >
            {isExpanded ? '✕' : getMainButtonContent()}
          </Button>

          {/* Follow hint on hover */}
          {!isExpanded && (
            <div className="absolute top-16 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/90 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap border border-white/20">
                Follow movie releases
              </div>
            </div>
          )}
        </div>

        {/* Netflix-style title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-bold text-lg mb-1">{movie.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              ⭐ {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
            </span>
            {movie.unifiedDates.usTheatrical && (
              <span>🎬 {formatDate(movie.unifiedDates.usTheatrical)}</span>
            )}
            {movie.unifiedDates.streaming && (
              <span>📺 {formatDate(movie.unifiedDates.streaming)}</span>
            )}
          </div>
        </div>

        {/* Follow status badge */}
        {displayFollowTypes.length > 0 && !followLoading && !statusLoading && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-medium">
            {displayFollowTypes.length === 2 ? 'Following Both' :
             displayFollowTypes.includes('THEATRICAL') ? 'Following Theater' :
             'Following Streaming'}
          </div>
        )}

        {/* Loading indicator */}
        {(followLoading || statusLoading) && (
          <div
            className="absolute top-4 left-4 w-6 h-6 border-2 rounded-full"
            style={{
              animation: 'spin 1s linear infinite',
              borderTopColor: '#eab308', // Netflix gold
              borderRightColor: '#d1d5db20', // Light gray with transparency
              borderBottomColor: '#d1d5db20',
              borderLeftColor: '#d1d5db20'
            }}
          >
            <div className="sr-only">Loading...</div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-600/90 text-white text-xs px-3 py-2 rounded-lg animate-in slide-in-from-top">
            {error}
          </div>
        )}
      </div>
    </Card>
  )
}