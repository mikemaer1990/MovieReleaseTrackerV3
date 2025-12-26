'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useFollows, FollowRecord } from '@/hooks/use-follows'
import { MovieCard } from '@/components/movie/movie-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/page-header'
import { Film, Calendar, Star, Search, Check } from 'lucide-react'
import Link from 'next/link'
import { MovieService } from '@/lib/services/movie-service'
import { isStreamingReleased } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
type FollowType = 'THEATRICAL' | 'STREAMING' | 'BOTH'

interface GroupedMovie {
  id: string
  movies: FollowRecord['movies']
  followTypes: FollowType[]
  created_at: string
}

export default function Dashboard() {
  const { isAuthenticated } = useAuthContext()
  const { getUserFollows, unfollowMovie, followMovie, loading } = useFollows()
  const [follows, setFollows] = useState<FollowRecord[]>([])
  const [groupedMovies, setGroupedMovies] = useState<GroupedMovie[]>([])
  const [loadingFollows, setLoadingFollows] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    theatrical: 0,
    streaming: 0,
    released: 0,
  })

  const calculateStats = (userFollows: FollowRecord[], grouped: GroupedMovie[]) => {
    const total = grouped.length

    const theatrical = grouped.filter((movie: GroupedMovie) =>
      movie.followTypes.some((type: FollowType) => type === 'THEATRICAL' || type === 'BOTH')
    ).length

    const streaming = grouped.filter((movie: GroupedMovie) =>
      movie.followTypes.some((type: FollowType) => type === 'STREAMING' || type === 'BOTH')
    ).length

    // Count released movies (movies available on streaming)
    const released = grouped.filter((movie: GroupedMovie) => {
      const dbReleaseDates = movie.movies.release_dates?.map(rd => ({
        id: rd.id,
        movieId: rd.movie_id,
        country: rd.country,
        releaseType: rd.release_type,
        releaseDate: rd.release_date,
        certification: rd.certification,
        createdAt: new Date(rd.created_at)
      }))
      const unifiedDates = MovieService.buildUnifiedDatesFromDB(dbReleaseDates)
      return isStreamingReleased({ unifiedDates })
    }).length

    return { total, theatrical, streaming, released }
  }

  const groupFollowsByMovie = (userFollows: FollowRecord[]) => {
    const movieMap = new Map()

    userFollows.forEach((follow) => {
      const movieId = follow.movies.id

      if (movieMap.has(movieId)) {
        // Add this follow type to existing movie
        const existingMovie = movieMap.get(movieId)
        existingMovie.followTypes.push(follow.follow_type)
      } else {
        // Create new movie entry
        movieMap.set(movieId, {
          id: follow.id, // Use first follow record ID
          movies: follow.movies,
          followTypes: [follow.follow_type],
          created_at: follow.created_at
        })
      }
    })

    // Convert to array and sort intelligently
    const moviesArray = Array.from(movieMap.values())

    return moviesArray.sort((a, b) => {
      // Get unified dates and relevant info for both movies
      const getMovieInfo = (movie: GroupedMovie) => {
        const dbReleaseDates = movie.movies.release_dates?.map(rd => ({
          id: rd.id,
          movieId: rd.movie_id,
          country: rd.country,
          releaseType: rd.release_type,
          releaseDate: rd.release_date,
          certification: rd.certification,
          createdAt: new Date(rd.created_at)
        }))
        const unifiedDates = MovieService.buildUnifiedDatesFromDB(dbReleaseDates)

        return {
          streamingDate: unifiedDates?.streaming,
          theatricalDate: unifiedDates?.usTheatrical || movie.movies.release_date,
          hasStreaming: !!unifiedDates?.streaming
        }
      }

      const infoA = getMovieInfo(a)
      const infoB = getMovieInfo(b)

      // Get the most relevant date for sorting
      const dateA = infoA.streamingDate || infoA.theatricalDate
      const dateB = infoB.streamingDate || infoB.theatricalDate

      // Handle null/undefined dates (put them at the end)
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1

      const timeA = new Date(dateA).getTime()
      const timeB = new Date(dateB).getTime()

      // Prioritize movies with streaming dates over theatrical-only
      if (infoA.hasStreaming !== infoB.hasStreaming) {
        return infoA.hasStreaming ? -1 : 1
      }

      // Within each group (streaming or theatrical), sort chronologically (earliest first)
      return timeA - timeB
    })
  }

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchFollows = async () => {
      try {
        setLoadingFollows(true)
        const userFollows = await getUserFollows()
        setFollows(userFollows)
        
        // Group follows by movie
        const grouped = groupFollowsByMovie(userFollows)
        setGroupedMovies(grouped)

        // Calculate and set stats
        setStats(calculateStats(userFollows, grouped))
      } catch (error) {
        console.error('Error fetching follows:', error)
      } finally {
        setLoadingFollows(false)
      }
    }

    fetchFollows()
  }, [isAuthenticated, getUserFollows])

  const handleFollow = async (movieId: number, followType: FollowType) => {
    try {
      await followMovie(movieId, followType)
      // Refresh the follows list after following
      const userFollows = await getUserFollows()
      setFollows(userFollows)
      const grouped = groupFollowsByMovie(userFollows)
      setGroupedMovies(grouped)
      setStats(calculateStats(userFollows, grouped))
    } catch (error) {
      console.error('Error following movie:', error)
    }
  }

  const handleUnfollow = async (movieId: number, followType?: FollowType) => {
    // Optimistic update - update UI immediately
    const updatedFollows = follows.filter((follow: FollowRecord) => {
      if (follow.movies.id !== movieId) return true
      if (followType && follow.follow_type !== followType) return true
      return false
    })

    setFollows(updatedFollows)
    const grouped = groupFollowsByMovie(updatedFollows)
    setGroupedMovies(grouped)
    setStats(calculateStats(updatedFollows, grouped))

    try {
      await unfollowMovie(movieId, followType)
      // Refresh the follows list to ensure consistency
      const userFollows = await getUserFollows()
      setFollows(userFollows)
      const grouped = groupFollowsByMovie(userFollows)
      setGroupedMovies(grouped)
      setStats(calculateStats(userFollows, grouped))
    } catch (error) {
      console.error('Error unfollowing movie:', error)
      // Revert optimistic update on error
      const userFollows = await getUserFollows()
      setFollows(userFollows)
      const grouped = groupFollowsByMovie(userFollows)
      setGroupedMovies(grouped)
      setStats(calculateStats(userFollows, grouped))
    }
  }


  if (!isAuthenticated) {
    return (
      <div className="py-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Please sign in to view your dashboard</h1>
        <Button asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-8">
      <PageHeader
        title="My Movie Dashboard"
        description="Manage your followed movies and notification preferences"
      />

      {/* Stats Badges */}
      <div className="flex flex-wrap gap-2 -mt-4">
        <Badge variant="outline" className="px-3 py-1.5 text-sm bg-zinc-800/60 text-zinc-200 border-zinc-700">
          <Film className="h-4 w-4 mr-1.5" />
          {stats.total} Total
        </Badge>
        <Badge variant="outline" className="px-3 py-1.5 text-sm bg-zinc-800/60 text-zinc-200 border-zinc-700">
          <Calendar className="h-4 w-4 mr-1.5" />
          {stats.theatrical} Theater
        </Badge>
        <Badge variant="outline" className="px-3 py-1.5 text-sm bg-zinc-800/60 text-zinc-200 border-zinc-700">
          <Star className="h-4 w-4 mr-1.5" />
          {stats.streaming} Streaming
        </Badge>
        <Badge variant="outline" className={`px-3 py-1.5 text-sm ${
          stats.released > 0
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-zinc-800/60 text-zinc-200 border-zinc-700'
        }`}>
          <Check className="h-4 w-4 mr-1.5" />
          {stats.released} Released
        </Badge>
      </div>

      {/* Movies Grid */}
      <div>
        
        {loadingFollows ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse flex flex-col h-full">
                <div className="aspect-[3/4] bg-muted rounded-t-lg" />
                <CardContent className="p-3 flex-grow space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groupedMovies.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent className="space-y-4">
              <Film className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">No movies followed yet</h3>
              <p className="text-muted-foreground">
                Start by searching for movies you want to track
              </p>
              <Button asChild>
                <Link href="/search">Search Movies</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            <AnimatePresence mode="popLayout">
              {groupedMovies.map((groupedMovie) => {
                // Transform database movie to TMDB format
                const tmdbMovie = {
                  id: groupedMovie.movies.id,
                  title: groupedMovie.movies.title,
                  poster_path: groupedMovie.movies.poster_path,
                  release_date: groupedMovie.movies.release_date || '',
                  vote_average: groupedMovie.movies.vote_average || 0,
                  overview: groupedMovie.movies.overview || '',
                  backdrop_path: null,
                  genre_ids: [],
                  popularity: groupedMovie.movies.popularity || 0,
                  vote_count: 0,
                  adult: false,
                  original_language: '',
                  original_title: groupedMovie.movies.title,
                }

                // Build unified dates from database release_dates
                const dbReleaseDates = groupedMovie.movies.release_dates?.map(rd => ({
                  id: rd.id,
                  movieId: rd.movie_id,
                  country: rd.country,
                  releaseType: rd.release_type,
                  releaseDate: rd.release_date,
                  certification: rd.certification,
                  createdAt: new Date(rd.created_at)
                }))
                const unifiedDates = MovieService.buildUnifiedDatesFromDB(dbReleaseDates)

                // Check if movie is released on streaming
                const isReleased = isStreamingReleased({ unifiedDates })

                return (
                  <motion.div
                    key={groupedMovie.movies.id}
                    layout
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{
                      scale: 0,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1], // Material Design easing curve
                    }}
                  >
                    <MovieCard
                      movie={tmdbMovie}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                      followTypes={groupedMovie.followTypes}
                      loading={loading}
                      unifiedDates={unifiedDates}
                      className={!isReleased ? "ring-2 ring-primary/20 bg-primary/5" : undefined}
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}