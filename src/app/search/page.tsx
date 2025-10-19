'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { MovieCard } from '@/components/movie/movie-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Loader2, X } from 'lucide-react'
import { TMDBMovie, TMDBSearchResponse, FollowType, UnifiedReleaseDates } from '@/types/movie'
import { useFollows } from '@/hooks/use-follows'
import { useDebounce } from '@/hooks/use-debounce'

interface FollowRecord {
  movies: {
    id: number
  }
  follow_type: FollowType
}

const MIN_SEARCH_CHARS = 3

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
  const [error, setError] = useState<string | null>(null)

  // Debounce the search query
  const debouncedQuery = useDebounce(query, 500)

  // AbortController ref for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null)

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

  // Live search effect - triggers when debounced query changes
  useEffect(() => {
    if (isAuthenticated) {
      // If query is empty or less than minimum chars, clear results
      if (debouncedQuery.trim().length === 0) {
        setResults([])
        setTotalPages(0)
        setCurrentPage(1)
        setError(null)
        return
      }

      // Only search if query meets minimum character requirement
      if (debouncedQuery.trim().length >= MIN_SEARCH_CHARS) {
        searchMovies(debouncedQuery, 1)
      }
    }
  }, [debouncedQuery, isAuthenticated])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key clears search
      if (e.key === 'Escape' && query) {
        handleClearSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [query])

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

      follows.forEach((follow: FollowRecord) => {
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
      setError(null)
      return
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/movies/search?q=${encodeURIComponent(searchQuery)}&page=${page}`,
        { signal: abortController.signal }
      )

      if (response.ok) {
        const data: TMDBSearchResponse = await response.json()
        setResults(data.results)
        setTotalPages(data.total_pages)
        setCurrentPage(page)
      } else {
        setError('Failed to search movies. Please try again.')
      }
    } catch (error) {
      // Don't set error for aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error('Error searching movies:', error)
      setError('An error occurred while searching. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setQuery('')
    setResults([])
    setTotalPages(0)
    setCurrentPage(1)
    setError(null)

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Trigger search immediately on form submit (Enter key)
    if (query.trim().length >= MIN_SEARCH_CHARS) {
      searchMovies(query)
    }
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
          Search for movies you want to follow and get notified when they&apos;re released
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
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for movies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pr-10"
                aria-label="Search movies"
                aria-describedby="search-hint"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <p id="search-hint" className="text-muted-foreground">
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Searching...</span>
                  </span>
                ) : query.trim().length > 0 && query.trim().length < MIN_SEARCH_CHARS ? (
                  `Type at least ${MIN_SEARCH_CHARS} characters to search`
                ) : (
                  'Start typing to search for movies'
                )}
              </p>
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd> to clear
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {query && query.trim().length >= MIN_SEARCH_CHARS && (
        <section aria-live="polite" aria-atomic="true">
          <h2 className="text-2xl font-semibold mb-6">
            Search Results {results.length > 0 && !loading && `(${results.length} found)`}
          </h2>

          {/* Error State */}
          {error && !loading && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
              <p className="text-destructive font-medium">{error}</p>
              <Button
                onClick={() => searchMovies(query)}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Searching for movies...</p>
            </div>
          )}

          {/* Results */}
          {!loading && !error && results.length > 0 && (
            <div className="animate-in fade-in-50 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {results.map((movie) => (
                  <div key={movie.id} className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
                    <MovieCard
                      movie={movie}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                      followTypes={followingMovies.get(movie.id) || []}
                      loading={followLoading}
                      unifiedDates={(movie as TMDBMovie & { unifiedDates?: UnifiedReleaseDates }).unifiedDates}
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
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-12 animate-in fade-in-50 duration-300">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground mb-2">
                No movies found for &quot;{query}&quot;
              </p>
              <p className="text-sm text-muted-foreground">
                Try a different search term or browse our discover section below
              </p>
            </div>
          )}
        </section>
      )}

      {/* Minimum Characters Hint */}
      {query && query.trim().length > 0 && query.trim().length < MIN_SEARCH_CHARS && (
        <section className="text-center py-12 animate-in fade-in-50 duration-300">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg text-muted-foreground">
            Keep typing... (minimum {MIN_SEARCH_CHARS} characters required)
          </p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {discoverMovies.map((movie) => (
                  <div key={movie.id}>
                    <MovieCard
                      movie={movie}
                      onFollow={handleFollow}
                      onUnfollow={handleUnfollow}
                      followTypes={followingMovies.get(movie.id) || []}
                      loading={followLoading}
                      unifiedDates={(movie as TMDBMovie & { unifiedDates?: UnifiedReleaseDates }).unifiedDates}
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