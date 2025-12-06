import { TMDBMovie } from '@/types/movie'
import { tmdbService } from '@/lib/tmdb'
import { CacheService } from '@/lib/redis'
import { enrichMoviesWithDatesFast } from '@/lib/tmdb-utils'

interface EnrichedMovie extends TMDBMovie {
  unifiedDates?: {
    usTheatrical: string | null
    streaming: string | null
    primary: string | null
    limited: string | null
    digital: string | null
  }
}

interface RecentCacheData {
  movies: EnrichedMovie[]
  totalCount: number
  cacheBuiltAt: string
  filters: {
    daysBack: number
    voteCountMin: number
    voteAverageMin: number
  }
}

interface FetchStats {
  totalFetched: number
  totalPages: number
  filteredCount: number
  oldestDate: string
  newestDate: string
}

interface CacheBuildResult {
  success: boolean
  data?: RecentCacheData
  error?: string
  stats: FetchStats
}

class RecentCacheService {
  private static readonly CACHE_KEY = 'recent_movies_digital'
  private static readonly CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds

  // Default filters
  private static readonly DEFAULT_DAYS_BACK = 90
  private static readonly DEFAULT_VOTE_COUNT_MIN = 10
  private static readonly DEFAULT_VOTE_AVERAGE_MIN = 6.0
  private static readonly TARGET_MOVIE_COUNT = 100
  private static readonly MAX_PAGES_TO_FETCH = 15

  /**
   * Get recent movies from cache
   */
  static async getRecentMovies(
    page: number = 1,
    limit: number = 30
  ): Promise<{
    movies: EnrichedMovie[]
    pagination: {
      page: number
      total_pages: number
      total_results: number
    }
    filters: {
      daysBack: number
      voteCountMin: number
      voteAverageMin: number
    }
  }> {
    // Try to get from cache first
    let cacheData = await CacheService.get<RecentCacheData>(this.CACHE_KEY)

    // If cache miss, build the cache
    if (!cacheData) {
      console.log('Cache miss - building recent movies cache...')
      const buildResult = await this.buildCache()

      if (!buildResult.success || !buildResult.data) {
        throw new Error(`Failed to build recent movies cache: ${buildResult.error}`)
      }

      cacheData = buildResult.data
    }

    // Apply pagination
    const totalResults = cacheData.totalCount
    const totalPages = Math.ceil(totalResults / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMovies = cacheData.movies.slice(startIndex, endIndex)

    return {
      movies: paginatedMovies,
      pagination: {
        page,
        total_pages: totalPages,
        total_results: totalResults,
      },
      filters: cacheData.filters,
    }
  }

  /**
   * Build the cache by fetching and processing recent digital releases
   */
  static async buildCache(): Promise<CacheBuildResult> {
    try {
      const daysBack = this.DEFAULT_DAYS_BACK
      const voteCountMin = this.DEFAULT_VOTE_COUNT_MIN
      const voteAverageMin = this.DEFAULT_VOTE_AVERAGE_MIN

      // Calculate cutoff date and today's date
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysBack)
      const cutoffDateString = cutoffDate.toISOString().split('T')[0]

      // Dynamic fetching
      const allMovies: TMDBMovie[] = []
      const uniqueMovieIds = new Set<number>()
      let currentPage = 1
      let recentDigitalMovies: EnrichedMovie[] = []

      // Keep fetching until we have enough filtered movies or hit the max pages
      while (recentDigitalMovies.length < this.TARGET_MOVIE_COUNT && currentPage <= this.MAX_PAGES_TO_FETCH) {
        // Fetch next page
        const result = await tmdbService.getRecentDigitalReleases({
          daysBack: daysBack + 30,
          voteCountMin,
          voteAverageMin,
          page: currentPage
        })

        // Add unique, non-adult movies
        result.results.forEach(movie => {
          if (!movie.adult && !uniqueMovieIds.has(movie.id)) {
            uniqueMovieIds.add(movie.id)
            allMovies.push(movie)
          }
        })

        // Enrich the current batch with unified release dates
        const enrichedBatch = await enrichMoviesWithDatesFast(allMovies) as EnrichedMovie[]

        // Filter by digital/streaming release date
        recentDigitalMovies = enrichedBatch.filter(movie => {
          const digitalDate = movie.unifiedDates?.digital || movie.unifiedDates?.streaming

          if (!digitalDate) {
            return false
          }

          // Only include movies released between cutoff date and today (inclusive)
          return digitalDate >= cutoffDateString && digitalDate <= todayString
        })

        // Move to next page
        currentPage++

        // Break if TMDB has no more results
        if (result.results.length === 0) {
          break
        }
      }

      // Sort by digital/streaming release date (newest first)
      recentDigitalMovies.sort((a, b) => {
        const dateA = a.unifiedDates?.digital || a.unifiedDates?.streaming || ''
        const dateB = b.unifiedDates?.digital || b.unifiedDates?.streaming || ''
        return dateB.localeCompare(dateA)
      })

      // Get stats
      const dates = recentDigitalMovies.map(m => m.unifiedDates?.digital || m.unifiedDates?.streaming || '')
      const oldestDate = dates[dates.length - 1] || ''
      const newestDate = dates[0] || ''

      const cacheData: RecentCacheData = {
        movies: recentDigitalMovies,
        totalCount: recentDigitalMovies.length,
        cacheBuiltAt: new Date().toISOString(),
        filters: {
          daysBack,
          voteCountMin,
          voteAverageMin,
        },
      }

      // Store in cache
      await CacheService.set(this.CACHE_KEY, cacheData, this.CACHE_TTL)

      return {
        success: true,
        data: cacheData,
        stats: {
          totalFetched: allMovies.length,
          totalPages: currentPage - 1,
          filteredCount: recentDigitalMovies.length,
          oldestDate,
          newestDate,
        },
      }
    } catch (error) {
      console.error('Error building recent movies cache:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats: {
          totalFetched: 0,
          totalPages: 0,
          filteredCount: 0,
          oldestDate: '',
          newestDate: '',
        },
      }
    }
  }

  /**
   * Force rebuild the cache (used by cron job)
   */
  static async rebuildCache(): Promise<CacheBuildResult> {
    console.log('Force rebuilding recent movies cache...')
    return this.buildCache()
  }
}

export { RecentCacheService }
