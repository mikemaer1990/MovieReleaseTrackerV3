'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useFollows, FollowRecord } from '@/hooks/use-follows'
import { MovieCard } from '@/components/movie/movie-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Film, Calendar, Star, Search } from 'lucide-react'
import Link from 'next/link'
import { MovieService } from '@/lib/services/movie-service'
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
  })

  const calculateStats = (userFollows: FollowRecord[]) => {
    const grouped = groupFollowsByMovie(userFollows)
    const total = grouped.length

    const theatrical = grouped.filter((movie: GroupedMovie) =>
      movie.followTypes.some((type: FollowType) => type === 'THEATRICAL' || type === 'BOTH')
    ).length

    const streaming = grouped.filter((movie: GroupedMovie) =>
      movie.followTypes.some((type: FollowType) => type === 'STREAMING' || type === 'BOTH')
    ).length
    
    return { total, theatrical, streaming }
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

    // Convert to array and sort by release date (soonest first)
    const moviesArray = Array.from(movieMap.values())

    return moviesArray.sort((a, b) => {
      // Get US theatrical release date from release_dates if available
      const getReleaseDate = (movie: GroupedMovie) => {
        const usTheatrical = movie.movies.release_dates?.find(
          rd => rd.country === 'US' && rd.release_type === 'THEATRICAL'
        )
        return usTheatrical?.release_date || movie.movies.release_date
      }

      const dateA = getReleaseDate(a)
      const dateB = getReleaseDate(b)

      // Handle null/undefined dates (put them at the end)
      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1

      // Sort by date ascending (soonest first)
      return new Date(dateA).getTime() - new Date(dateB).getTime()
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
        setStats(calculateStats(userFollows))
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
      setGroupedMovies(groupFollowsByMovie(userFollows))
      setStats(calculateStats(userFollows))
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
    setGroupedMovies(groupFollowsByMovie(updatedFollows))
    setStats(calculateStats(updatedFollows))

    try {
      await unfollowMovie(movieId, followType)
      // Refresh the follows list to ensure consistency
      const userFollows = await getUserFollows()
      setFollows(userFollows)
      setGroupedMovies(groupFollowsByMovie(userFollows))
      setStats(calculateStats(userFollows))
    } catch (error) {
      console.error('Error unfollowing movie:', error)
      // Revert optimistic update on error
      const userFollows = await getUserFollows()
      setFollows(userFollows)
      setGroupedMovies(groupFollowsByMovie(userFollows))
      setStats(calculateStats(userFollows))
    }
  }


  if (!isAuthenticated) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Please sign in to view your dashboard</h1>
        <Button asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">My Movie Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your followed movies and notification preferences
          </p>
        </div>
        <Button asChild size="lg" className="shadow-md shrink-0">
          <Link href="/search" className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find More Movies
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Followed</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Theater Releases</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.theatrical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streaming Releases</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streaming}</div>
          </CardContent>
        </Card>
      </div>

      {/* Followed Movies */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Your Followed Movies</h2>
        
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

              return (
                <MovieCard
                  key={groupedMovie.movies.id}
                  movie={tmdbMovie}
                  onFollow={handleFollow}
                  onUnfollow={handleUnfollow}
                  followTypes={groupedMovie.followTypes}
                  loading={loading}
                  unifiedDates={unifiedDates}
                  className="ring-2 ring-primary/20 bg-primary/5"
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}