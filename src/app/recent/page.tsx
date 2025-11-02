'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useFollows } from '@/hooks/use-follows'
import { supabase } from '@/lib/supabase'
import { MovieCard } from '@/components/movie/movie-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Film,
  RefreshCw,
  Calendar,
  Sparkles
} from 'lucide-react'

type FollowType = 'THEATRICAL' | 'STREAMING' | 'BOTH'

interface Movie {
  id: number
  title: string
  poster_path: string
  release_date: string
  vote_average: number
  vote_count: number
  overview: string
  popularity: number
  original_language: string
  unifiedDates?: {
    usTheatrical: string | null
    streaming: string | null
    digital: string | null
  }
}

interface PaginationInfo {
  page: number
  total_pages: number
  total_results: number
}

interface FiltersInfo {
  daysBack: number
  voteCountMin: number
  voteAverageMin: number
}

interface RecentResponse {
  movies: Movie[]
  pagination: PaginationInfo
  filters: FiltersInfo
  success: boolean
  error?: string
}

interface UserFollow {
  movies: {
    id: number
  }
  follow_type: FollowType
}

export default function RecentMovies() {
  const { isAuthenticated } = useAuthContext()
  const { followMovie, unfollowMovie, loading: followLoading } = useFollows()

  // State
  const [movies, setMovies] = useState<Movie[]>([])
  const [userFollows, setUserFollows] = useState<UserFollow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [filters, setFilters] = useState<FiltersInfo | null>(null)

  // Fetch recent movies
  const fetchRecentMovies = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const response = await fetch(`/api/movies/recent?page=${page}&limit=30`)

      if (!response.ok) {
        throw new Error('Failed to fetch recent movies')
      }

      const data: RecentResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch movies')
      }

      // Append or replace movies
      setMovies(prev => append ? [...prev, ...data.movies] : data.movies)
      setPagination(data.pagination)
      setFilters(data.filters)
      setCurrentPage(page)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch movies'
      setError(errorMessage)
      console.error('Error fetching recent movies:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Fetch user follows
  const fetchUserFollows = async () => {
    if (!isAuthenticated) return

    try {
      const response = await fetch('/api/follows', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUserFollows(data.follows || [])
      }
    } catch (error) {
      console.error('Error fetching user follows:', error)
    }
  }

  // Infinite scroll handler
  const handleScroll = () => {
    // Check if user scrolled near bottom (within 500px)
    const scrollPosition = window.innerHeight + window.scrollY
    const pageHeight = document.documentElement.scrollHeight
    const nearBottom = pageHeight - scrollPosition < 500

    // Load more if near bottom, not already loading, and more pages available
    if (nearBottom && !loadingMore && !loading && pagination) {
      if (currentPage < pagination.total_pages) {
        fetchRecentMovies(currentPage + 1, true)
      }
    }
  }

  // Handle follow/unfollow
  const handleFollow = async (movieId: number, followType: FollowType) => {
    if (!isAuthenticated) return

    try {
      await followMovie(movieId, followType)
      await fetchUserFollows()
    } catch (error) {
      console.error('Error following movie:', error)
    }
  }

  const handleUnfollow = async (movieId: number, followType: FollowType) => {
    if (!isAuthenticated) return

    try {
      await unfollowMovie(movieId, followType)
      await fetchUserFollows()
    } catch (error) {
      console.error('Error unfollowing movie:', error)
    }
  }

  // Get follow types for a movie
  const getMovieFollowTypes = (movieId: number): FollowType[] => {
    return userFollows
      .filter(f => f.movies.id === movieId)
      .map(f => f.follow_type)
  }

  // Check if movie is followed
  const isMovieFollowed = (movieId: number): boolean => {
    return userFollows.some(f => f.movies.id === movieId)
  }

  // Initial load
  useEffect(() => {
    fetchRecentMovies(1)
  }, [])

  // Fetch user follows when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserFollows()
    }
  }, [isAuthenticated])

  // Infinite scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingMore, loading, pagination, currentPage])

  // Error state
  if (error && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Failed to load recent releases</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchRecentMovies(1)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="mb-4 sm:mb-0">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Recent Releases</h1>
          </div>
          <p className="text-muted-foreground">
            Quality digital releases from the last {filters?.daysBack || 90} days
            {pagination && (
              <span className="ml-2">
                • {pagination.total_results.toLocaleString()} movies found
              </span>
            )}
          </p>
          {filters && (
            <p className="text-sm text-muted-foreground mt-1">
              Minimum rating: {filters.voteAverageMin}/10 • At least {filters.voteCountMin} votes
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setMovies([])
            setCurrentPage(1)
            fetchRecentMovies(1)
          }}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading recent releases...</span>
        </div>
      )}

      {/* Movies Grid */}
      {!loading && movies.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
            {movies.map(movie => {
              // Transform to TMDB format
              const tmdbMovie = {
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                vote_average: movie.vote_average,
                overview: movie.overview,
                backdrop_path: null,
                genre_ids: [],
                popularity: movie.popularity,
                vote_count: movie.vote_count,
                adult: false,
                original_language: movie.original_language,
                original_title: movie.title,
              }

              return (
                <MovieCard
                  key={movie.id}
                  movie={tmdbMovie}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  followTypes={getMovieFollowTypes(movie.id)}
                  loading={followLoading}
                  unifiedDates={{
                    usTheatrical: movie.unifiedDates?.usTheatrical || null,
                    streaming: movie.unifiedDates?.streaming || movie.unifiedDates?.digital || null,
                    primary: movie.release_date,
                    limited: null,
                    digital: movie.unifiedDates?.digital || null,
                  }}
                  className={isMovieFollowed(movie.id) ? 'ring-2 ring-primary/20 bg-primary/5' : ''}
                />
              )
            })}
          </div>

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary mr-3" />
              <span className="text-muted-foreground">Loading more movies...</span>
            </div>
          )}

          {/* End of List Indicator */}
          {!loadingMore && pagination && currentPage >= pagination.total_pages && movies.length > 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                You&apos;ve seen all {pagination.total_results} movies
              </p>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && movies.length === 0 && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No recent releases found</h3>
            <p className="text-muted-foreground">
              There are no quality digital releases in the selected time period.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
