'use client'

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useFollows } from '@/hooks/use-follows'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Film, Calendar, Star, Trash2, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
type FollowType = 'THEATRICAL' | 'STREAMING' | 'BOTH'

interface Movie {
  id: number
  title: string
  poster_path: string
  release_date: string
  vote_average: number
  overview: string
}

interface Follow {
  id: string
  follow_type: FollowType
  created_at: string
  movies: Movie
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthContext()
  const { getUserFollows, unfollowMovie, loading } = useFollows()
  const [follows, setFollows] = useState<Follow[]>([])
  const [groupedMovies, setGroupedMovies] = useState<any[]>([])
  const [loadingFollows, setLoadingFollows] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    theatrical: 0,
    streaming: 0,
  })

  const calculateStats = (userFollows: Follow[]) => {
    const grouped = groupFollowsByMovie(userFollows)
    const total = grouped.length
    
    const theatrical = grouped.filter((movie: any) => 
      movie.followTypes.some((type: FollowType) => type === 'THEATRICAL' || type === 'BOTH')
    ).length
    
    const streaming = grouped.filter((movie: any) => 
      movie.followTypes.some((type: FollowType) => type === 'STREAMING' || type === 'BOTH')
    ).length
    
    return { total, theatrical, streaming }
  }

  const groupFollowsByMovie = (userFollows: Follow[]) => {
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
    
    return Array.from(movieMap.values())
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

  const handleUnfollow = async (movieId: number, followType?: FollowType) => {
    // Optimistic update - update UI immediately
    const updatedFollows = follows.filter(follow => {
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

  const getFollowTypeBadge = (followType: FollowType) => {
    const variants = {
      'THEATRICAL': 'default',
      'STREAMING': 'secondary',
      'BOTH': 'destructive'
    } as const

    return (
      <Badge variant={variants[followType]}>
        {followType === 'BOTH' ? 'Theater & Streaming' : followType.toLowerCase()}
      </Badge>
    )
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-muted rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedMovies.map((groupedMovie) => (
              <Card key={groupedMovie.movies.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[2/3] relative">
                  <Image
                    src={groupedMovie.movies.poster_path 
                      ? `https://image.tmdb.org/t/p/w500${groupedMovie.movies.poster_path}`
                      : '/placeholder-poster.svg'
                    }
                    alt={groupedMovie.movies.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold line-clamp-2 mb-1">
                      {groupedMovie.movies.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(groupedMovie.movies.release_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">
                        {groupedMovie.movies.vote_average.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {groupedMovie.followTypes.map((followType: FollowType) => (
                        <span key={followType}>
                          {getFollowTypeBadge(followType)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {groupedMovie.movies.overview}
                  </p>

                  <div className="space-y-2">
                    {groupedMovie.followTypes.map((followType: FollowType) => (
                      <Button
                        key={followType}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleUnfollow(groupedMovie.movies.id, followType)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Unfollow {followType === 'BOTH' ? 'Both' : followType === 'THEATRICAL' ? 'Theater' : 'Streaming'}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}