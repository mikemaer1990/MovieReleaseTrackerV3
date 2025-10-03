'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { MovieCard } from '@/components/movie/movie-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Loader2 } from 'lucide-react'
import { TMDBMovie, TMDBSearchResponse, FollowType } from '@/types/movie'
import { useFollows } from '@/hooks/use-follows'

export default function SearchPage() {
  const { isAuthenticated } = useAuthContext()
  const router = useRouter()
  const { followMovie, unfollowMovie, getUserFollows, loading: followLoading } = useFollows()
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBMovie[]>([])
  const [discoverMovies, setDiscoverMovies] = useState<TMDBMovie[]>([])
  const [loading, setLoading] = useState(false)
  const [discoverLoading, setDiscoverLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [followingMovies, setFollowingMovies] = useState<Map<number, FollowType[]>>(new Map())

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, router])

  // Load discover movies (upcoming + popular) and user follows on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchDiscoverMovies()
      fetchUserFollows()
    }
  }, [isAuthenticated])

  const fetchDiscoverMovies = async () => {
    try {
      setDiscoverLoading(true)
      // Fetch upcoming and popular in parallel
      const [upcomingResponse, popularResponse] = await Promise.all([
        fetch('/api/movies/upcoming?page=1&limit=20'),
        fetch('/api/movies/popular?page=1')
      ])

      if (upcomingResponse.ok && popularResponse.ok) {
        const upcomingData = await upcomingResponse.json()
        const popularData = await popularResponse.json()

        // Get upcoming movies (guaranteed unreleased)
        const upcomingMovies = upcomingData.movies || []

        // Get all popular movies (including already released)
        const popularMovies = popularData.results || []

        // Remove duplicates (movies in both lists)
        const upcomingIds = new Set(upcomingMovies.map((m: TMDBMovie) => m.id))
        const uniquePopular = popularMovies.filter((movie: TMDBMovie) => !upcomingIds.has(movie.id))

        // Combine: upcoming first, then unique popular
        const combinedMovies = [...upcomingMovies, ...uniquePopular]
        setDiscoverMovies(combinedMovies)
      }
    } catch (error) {
      console.error('Error fetching discover movies:', error)
    } finally {
      setDiscoverLoading(false)
    }
  }

  const fetchUserFollows = async () => {
    try {
      const follows = await getUserFollows()
      const followMap = new Map<number, FollowType[]>()
      
      follows.forEach((follow: any) => {
        const movieId = follow.movies.id
        const followType = follow.follow_type
        
        if (followMap.has(movieId)) {
          followMap.get(movieId)!.push(followType)
        } else {
          followMap.set(movieId, [followType])
        }
      })
      
      setFollowingMovies(followMap)
    } catch (error) {
      console.error('Error fetching user follows:', error)
    }
  }

  const searchMovies = async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) {
      setResults([])
      setTotalPages(0)
      setCurrentPage(1)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(
        `/api/movies/search?q=${encodeURIComponent(searchQuery)}&page=${page}`
      )
      
      if (response.ok) {
        const data: TMDBSearchResponse = await response.json()
        setResults(data.results)
        setTotalPages(data.total_pages)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error searching movies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchMovies(query)
  }

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      searchMovies(query, currentPage + 1)
    }
  }

  const handleFollow = async (movieId: number, followType: FollowType) => {
    try {
      await followMovie(movieId, followType)
      // Optimistic update - add follow type to movie
      setFollowingMovies(prev => {
        const newMap = new Map(prev)
        if (newMap.has(movieId)) {
          const existingTypes = newMap.get(movieId)!
          if (!existingTypes.includes(followType)) {
            newMap.set(movieId, [...existingTypes, followType])
          }
        } else {
          newMap.set(movieId, [followType])
        }
        return newMap
      })
    } catch (error) {
      console.error('Error following movie:', error)
      
      // If it's already being followed, still update the UI
      if (error instanceof Error && error.message.includes('Already following')) {
        setFollowingMovies(prev => {
          const newMap = new Map(prev)
          if (newMap.has(movieId)) {
            const existingTypes = newMap.get(movieId)!
            if (!existingTypes.includes(followType)) {
              newMap.set(movieId, [...existingTypes, followType])
            }
          } else {
            newMap.set(movieId, [followType])
          }
          return newMap
        })
      }
      // TODO: Show success/error toast/notification
    }
  }

  const handleUnfollow = async (movieId: number, followType: FollowType) => {
    try {
      await unfollowMovie(movieId, followType)
      // Optimistic update - remove follow type from movie
      setFollowingMovies(prev => {
        const newMap = new Map(prev)
        if (newMap.has(movieId)) {
          const existingTypes = newMap.get(movieId)!.filter(type => type !== followType)
          if (existingTypes.length === 0) {
            newMap.delete(movieId)
          } else {
            newMap.set(movieId, existingTypes)
          }
        }
        return newMap
      })
    } catch (error) {
      console.error('Error unfollowing movie:', error)
      // TODO: Show error toast/notification
    }
  }

  if (!isAuthenticated) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">Discover Movies</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Search for movies you want to follow and get notified when they're released
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Movies</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-2">
            <Input
              type="text"
              placeholder="Search for movies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {query && (
        <section>
          <h2 className="text-2xl font-semibold mb-6">
            Search Results {results.length > 0 && `(${results.length} found)`}
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="flex flex-wrap justify-center gap-4">
                {results.map((movie) => (
                  <div key={movie.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(20%-0.8rem)] xl:w-[calc(16.666%-0.833rem)]">
                    <MovieCard
                      movie={movie}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                      followTypes={followingMovies.get(movie.id) || []}
                      loading={followLoading}
                      unifiedDates={(movie as any).unifiedDates}
                    />
                  </div>
                ))}
              </div>

              {currentPage < totalPages && (
                <div className="text-center mt-8">
                  <Button onClick={handleLoadMore} variant="outline">
                    Load More Results
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No movies found for "{query}"</p>
            </div>
          )}
        </section>
      )}

      {/* Discover Movies (Upcoming + Popular Unreleased) */}
      {!query && (
        <section>
          <h2 className="text-2xl font-semibold mb-6">Discover Movies</h2>
          <p className="text-muted-foreground mb-6">
            Upcoming releases and popular movies you can follow
          </p>

          {discoverLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-4">
                {discoverMovies.map((movie) => (
                  <div key={movie.id} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(20%-0.8rem)] xl:w-[calc(16.666%-0.833rem)]">
                    <MovieCard
                      movie={movie}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                      followTypes={followingMovies.get(movie.id) || []}
                      loading={followLoading}
                      unifiedDates={(movie as any).unifiedDates}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}