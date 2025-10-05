'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TMDBEnhancedMovieDetails, UnifiedReleaseDates, FollowType } from '@/types/movie'

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
import Design2 from './designs/design-2'
import Design3 from './designs/design-3'
import Design4 from './designs/design-4'
import Design5 from './designs/design-5'
import Design6 from './designs/design-6'
import Design7 from './designs/design-7'

interface MovieDetailsSwitcherProps {
  movie: TMDBEnhancedMovieDetails & { unifiedDates: UnifiedReleaseDates }
  initialDesign?: string
}

const DESIGNS = [
  { id: '1', name: 'Rotten Tomatoes Enhanced', description: 'Improved layout, sticky actions, better mobile', component: Design7 },
  { id: '2', name: 'Classic IMDb Dark', description: 'Information-dense, professional, dark theme', component: Design2 },
  { id: '3', name: 'Netflix Inspired', description: 'Video-first, cinematic, autoplay trailer', component: Design3 },
  { id: '4', name: 'Split Screen Editorial', description: 'Magazine-style, poster + content split', component: Design4 },
  { id: '5', name: 'Muted Gold Glassmorphism', description: 'Frosted glass, subtle bronze/amber tones', component: Design5 },
  { id: '6', name: 'Grid Mosaic', description: 'Pinterest-style cards, modern bento grid', component: Design6 },
]

export default function MovieDetailsSwitcher({ movie, initialDesign }: MovieDetailsSwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentDesign = searchParams.get('design') || initialDesign || '1'

  const { isAuthenticated } = useAuthContext()
  const { followMovie, unfollowMovie, getUserFollows, loading: followLoading } = useFollows()
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])

  useEffect(() => {
    if (isAuthenticated) {
      loadFollowStatus()
    }
  }, [isAuthenticated, movie.id])

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
        isAuthenticated={isAuthenticated}
        followTypes={followTypes}
        followLoading={followLoading}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />
    </div>
  )
}
