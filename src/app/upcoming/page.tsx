'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useFollows } from '@/hooks/use-follows'
import { supabase } from '@/lib/supabase'
import { MovieCard } from '@/components/movie/movie-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Film,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Clock,
  Tv,
  Check
} from 'lucide-react'

type FollowType = 'THEATRICAL' | 'STREAMING' | 'BOTH'
type SortType = 'popularity' | 'release_date'

interface Movie {
  id: number
  title: string
  poster_path: string
  release_date: string
  vote_average: number
  overview: string
  popularity: number
  unifiedDates?: {
    usTheatrical: string | null
    streaming: string | null
  }
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalMovies: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface UpcomingResponse {
  movies: Movie[]
  pagination: PaginationInfo
  sort: SortType
  success: boolean
  error?: string
}

interface UserFollow {
  movies: {
    id: number
  }
  follow_type: FollowType
}

export default function UpcomingMovies() {
  const { isAuthenticated } = useAuthContext()
  const { followMovie, unfollowMovie, loading: followLoading } = useFollows()

  // State
  const [movies, setMovies] = useState<Movie[]>([])
  const [userFollows, setUserFollows] = useState<UserFollow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination and sorting
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [sortBy, setSortBy] = useState<SortType>('popularity')

  // Stats for Level 2 integration
  const [followStats, setFollowStats] = useState({
    totalFollowed: 0,
    theatricalCount: 0,
    streamingCount: 0,
    bothCount: 0
  })

  // Fetch upcoming movies
  const fetchUpcomingMovies = async (page: number = 1, sort: SortType = 'popularity') => {
    try {
      setLoading(page === 1) // Only show loading for first page
      const response = await fetch(`/api/movies/upcoming?sort=${sort}&page=${page}&limit=30`)

      if (!response.ok) {
        throw new Error('Failed to fetch upcoming movies')
      }

      const data: UpcomingResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch movies')
      }

      setMovies(data.movies)
      setPagination(data.pagination)
      setCurrentPage(page)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch movies'
      setError(errorMessage)
      console.error('Error fetching upcoming movies:', err)
    } finally {
      setLoading(false)
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

  // Calculate follow stats for Level 2 integration
  const calculateFollowStats = () => {
    if (!isAuthenticated) return

    const followedMovieIds = new Set(userFollows.map(f => f.movies.id))
    const followedUpcomingMovies = movies.filter(movie => followedMovieIds.has(movie.id))

    const stats = {
      totalFollowed: followedUpcomingMovies.length,
      theatricalCount: 0,
      streamingCount: 0,
      bothCount: 0
    }

    userFollows.forEach(follow => {
      if (followedMovieIds.has(follow.movies.id)) {
        if (follow.follow_type === 'THEATRICAL') stats.theatricalCount++
        else if (follow.follow_type === 'STREAMING') stats.streamingCount++
        else if (follow.follow_type === 'BOTH') stats.bothCount++
      }
    })

    setFollowStats(stats)
  }

  // Handle sort change
  const handleSortChange = (newSort: SortType) => {
    if (newSort !== sortBy) {
      setSortBy(newSort)
      setCurrentPage(1)
      fetchUpcomingMovies(1, newSort)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page !== currentPage && pagination) {
      if (page >= 1 && page <= pagination.totalPages) {
        fetchUpcomingMovies(page, sortBy)
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

  // Force refresh cache (for testing)
  const handleRefreshCache = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/movies/upcoming', { method: 'POST' })
      if (response.ok) {
        await fetchUpcomingMovies(1, sortBy)
      }
    } catch (error) {
      console.error('Error refreshing cache:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Get follow types for a movie (Level 2 integration)
  const getMovieFollowTypes = (movieId: number): FollowType[] => {
    return userFollows
      .filter(f => f.movies.id === movieId)
      .map(f => f.follow_type)
  }

  // Check if movie is followed (Level 2 integration)
  const isMovieFollowed = (movieId: number): boolean => {
    return userFollows.some(f => f.movies.id === movieId)
  }

  // Initial load
  useEffect(() => {
    fetchUpcomingMovies(1, 'popularity')
  }, [])

  // Fetch user follows when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserFollows()
    }
  }, [isAuthenticated])

  // Recalculate stats when movies or follows change
  useEffect(() => {
    calculateFollowStats()
  }, [movies, userFollows, isAuthenticated])

  // Error state
  if (error && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Failed to load upcoming movies</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchUpcomingMovies(1, sortBy)}>
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
          <h1 className="text-3xl font-bold mb-2">Upcoming Movies</h1>
          <p className="text-muted-foreground">
            Discover movies releasing in the next 6 months
            {pagination && (
              <span className="ml-2">
                • {pagination.totalMovies.toLocaleString()} movies found
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshCache}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Level 2 Follow Stats */}
      {isAuthenticated && followStats.totalFollowed > 0 && (
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-[0_0_15px_rgba(243,217,107,0.1)]">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 rounded-full p-2">
                  <BarChart3 className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(243,217,107,0.3)]" />
                </div>
                <span className="font-medium">
                  Following <span className="font-bold text-lg text-primary">{followStats.totalFollowed}</span> upcoming movie{followStats.totalFollowed !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {followStats.theatricalCount > 0 && (
                  <Badge className="bg-primary/15 border-primary/40 text-primary flex items-center gap-1.5">
                    <Film className="h-3 w-3" />
                    <span className="font-bold">{followStats.theatricalCount}</span> Theater
                  </Badge>
                )}
                {followStats.streamingCount > 0 && (
                  <Badge className="bg-primary/20 border-primary/50 text-primary flex items-center gap-1.5">
                    <Tv className="h-3 w-3" />
                    <span className="font-bold">{followStats.streamingCount}</span> Streaming
                  </Badge>
                )}
                {followStats.bothCount > 0 && (
                  <Badge className="bg-primary/25 border-primary/60 text-primary shadow-[0_0_8px_rgba(243,217,107,0.2)] flex items-center gap-1.5">
                    <Check className="h-3 w-3" />
                    <span className="font-bold">{followStats.bothCount}</span> Both
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sort Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <Button
              variant={sortBy === 'popularity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('popularity')}
              className="min-h-[44px]"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Most Popular
            </Button>
            <Button
              variant={sortBy === 'release_date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('release_date')}
              className="min-h-[44px]"
            >
              <Clock className="h-4 w-4 mr-2" />
              Soonest Release
            </Button>
          </div>
        </div>

        {/* Page Info */}
        {pagination && (
          <div className="text-sm text-muted-foreground text-center md:text-right">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading upcoming movies...</span>
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
                vote_count: 0,
                adult: false,
                original_language: '',
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
                    streaming: movie.unifiedDates?.streaming || null,
                    primary: movie.release_date,
                    limited: null,
                    digital: null,
                  }}
                  // Level 2 integration - highlight followed movies
                  className={isMovieFollowed(movie.id) ? 'ring-2 ring-primary/20 bg-primary/5' : ''}
                />
              )
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
              {/* Mobile: Compact buttons with page info */}
              <div className="flex items-center justify-between w-full sm:hidden gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="flex-1 max-w-[120px]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-1">Previous</span>
                </Button>

                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="flex-1 max-w-[120px]"
                >
                  <span className="mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Desktop: Full pagination with page numbers */}
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i
                    if (pageNum > pagination.totalPages) return null

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  }).filter(Boolean)}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && movies.length === 0 && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No upcoming movies found</h3>
            <p className="text-muted-foreground">
              There are no movies scheduled for release in the next 6 months.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}