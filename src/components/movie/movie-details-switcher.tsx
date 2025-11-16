'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TMDBEnhancedMovieDetails, UnifiedReleaseDates, FollowType, MovieRatings } from '@/types/movie'

interface FollowRecord {
  movies: {
    id: number
  }
  follow_type: FollowType
}

import { useAuthContext } from '@/components/providers/auth-provider'
import { useFollows } from '@/hooks/use-follows'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Palette, X } from 'lucide-react'

// Import designs
import Design1 from './designs/design-1'
import Design2 from './designs/design-2'

interface MovieDetailsSwitcherProps {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  initialRatings: MovieRatings
  initialDesign?: string
}

const DESIGNS = [
  { id: '1', name: 'Rotten Tomatoes Enhanced', description: 'Improved layout, sticky actions, better mobile', component: Design1 },
  { id: '2', name: 'Classic IMDb Dark', description: 'Information-dense, professional, dark theme', component: Design2 },
]

export default function MovieDetailsSwitcher({ movie, initialRatings, initialDesign }: MovieDetailsSwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDesign = searchParams.get('design') || initialDesign || '1'

  const { isAuthenticated } = useAuthContext()
  const { followMovie, unfollowMovie, getUserFollows, loading: followLoading } = useFollows()
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])
  const [ratings, setRatings] = useState<MovieRatings>(initialRatings)
  const [ratingsLoading, setRatingsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadFollowStatus()
    }
  }, [isAuthenticated, movie.id])

  // Fetch OMDB ratings client-side if they weren't included in initial render
  useEffect(() => {
    const fetchOMDBRatings = async () => {
      if (!movie.external_ids?.imdb_id) return

      // Check if we already have OMDB ratings (IMDb, RT, or Metacritic)
      const hasOMDBRatings = initialRatings.imdb || initialRatings.rottenTomatoes || initialRatings.metacritic
      if (hasOMDBRatings) {
        console.log('[CLIENT] OMDB ratings already loaded server-side')
        return
      }

      console.log('[CLIENT] Fetching OMDB ratings...')
      setRatingsLoading(true)
      try {
        const response = await fetch(
          `/api/movies/${movie.id}/ratings?imdbId=${movie.external_ids.imdb_id}`
        )
        const data = await response.json()

        if (data.ratings) {
          console.log('[CLIENT] OMDB ratings loaded')
          setRatings(prev => ({
            ...prev,
            ...data.ratings
          }))
        }
      } catch (error) {
        console.error('Error fetching OMDB ratings:', error)
      } finally {
        setRatingsLoading(false)
      }
    }

    fetchOMDBRatings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.id, movie.external_ids?.imdb_id])

  const loadFollowStatus = async () => {
    try {
      const follows = await getUserFollows() as FollowRecord[]
      const movieFollows = follows
        .filter((f) => f.movies.id === movie.id)
        .map((f) => f.follow_type)
      setFollowTypes(movieFollows)
    } catch (error) {
      console.error('Error loading follow status:', error)
    }
  }

  const handleFollow = async (_movieId: number, followType: FollowType) => {
    try {
      await followMovie(movie.id, followType)
      setFollowTypes(prev => [...prev, followType])
    } catch (error) {
      console.error('Error following movie:', error)
    }
  }

  const handleUnfollow = async (_movieId: number, followType: FollowType) => {
    try {
      await unfollowMovie(movie.id, followType)
      setFollowTypes(prev => prev.filter(t => t !== followType))
    } catch (error) {
      console.error('Error unfollowing movie:', error)
    }
  }

  const handleToggleFollow = async (_movieId: number, followType: FollowType) => {
    const isFollowingBoth = followTypes.includes('BOTH')
    const isFollowingTheatrical = followTypes.includes('THEATRICAL') || isFollowingBoth
    const isFollowingStreaming = followTypes.includes('STREAMING') || isFollowingBoth

    try {
      // If toggling theatrical
      if (followType === 'THEATRICAL') {
        if (isFollowingTheatrical) {
          // Unfollowing theatrical
          if (isFollowingBoth) {
            // Split BOTH into just STREAMING
            await unfollowMovie(movie.id, 'BOTH')
            await followMovie(movie.id, 'STREAMING')
            setFollowTypes(['STREAMING'])
          } else {
            // Just unfollow theatrical
            await unfollowMovie(movie.id, 'THEATRICAL')
            setFollowTypes(prev => prev.filter(t => t !== 'THEATRICAL'))
          }
        } else {
          // Following theatrical
          await followMovie(movie.id, 'THEATRICAL')
          setFollowTypes(prev => [...prev, 'THEATRICAL'])
        }
      }
      // If toggling streaming
      else if (followType === 'STREAMING') {
        if (isFollowingStreaming) {
          // Unfollowing streaming
          if (isFollowingBoth) {
            // Split BOTH into just THEATRICAL
            await unfollowMovie(movie.id, 'BOTH')
            await followMovie(movie.id, 'THEATRICAL')
            setFollowTypes(['THEATRICAL'])
          } else {
            // Just unfollow streaming
            await unfollowMovie(movie.id, 'STREAMING')
            setFollowTypes(prev => prev.filter(t => t !== 'STREAMING'))
          }
        } else {
          // Following streaming
          await followMovie(movie.id, 'STREAMING')
          setFollowTypes(prev => [...prev, 'STREAMING'])
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      // Reload follow status on error
      loadFollowStatus()
    }
  }

  const switchDesign = (designId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (designId === '1') {
      params.delete('design') // Default design doesn't need param
    } else {
      params.set('design', designId)
    }
    const query = params.toString()
    router.push(`/movie/${movie.id}${query ? `?${query}` : ''}`)
  }

  // Get the current design component
  const design = DESIGNS.find(d => d.id === currentDesign) || DESIGNS[0]
  const DesignComponent = design.component

  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="relative">
      {/* Design Switcher - Fixed Position */}
      <div className="fixed top-20 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
          className="gap-2 bg-background/95 backdrop-blur"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Design</span>
        </Button>

        {showPicker && (
          <Card className="absolute top-12 right-0 w-72 p-2 bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between mb-2 pb-2 border-b">
              <span className="text-sm font-semibold">Choose Design</span>
              <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {DESIGNS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    switchDesign(d.id)
                    setShowPicker(false)
                  }}
                  className={`w-full text-left p-2 rounded hover:bg-accent transition-colors ${
                    currentDesign === d.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="font-semibold text-sm">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.description}</div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Render Selected Design */}
      <DesignComponent
        movie={movie}
        ratings={ratings}
        isAuthenticated={isAuthenticated}
        followTypes={followTypes}
        followLoading={followLoading}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onToggleFollow={handleToggleFollow}
      />
    </div>
  )
}
