import { TMDBMovie, TMDBSearchResponse } from '@/types/movie'
import { tmdbService } from '@/lib/tmdb'
import { CacheService } from '@/lib/redis'

interface UpcomingCacheData {
  popularitySorted: TMDBMovie[]
  releaseDateSorted: TMDBMovie[]
  totalCount: number
  cacheBuiltAt: string
  dateRangeEnd: string
}

interface CacheBuildResult {
  success: boolean
  data?: UpcomingCacheData
  error?: string
  stats: {
    totalFetched: number
    totalPages: number
    duplicatesRemoved: number
    moviesWithin6Months: number
    foundMoviesBeyondCutoff: boolean
  }
}

class UpcomingCacheService {
  private static readonly CACHE_KEY_POPULARITY = 'upcoming_movies_popularity'
  private static readonly CACHE_KEY_RELEASE_DATE = 'upcoming_movies_release_date'
  private static readonly CACHE_KEY_METADATA = 'upcoming_movies_metadata'
  private static readonly CACHE_TTL = 24 * 60 * 60 // 24 hours in seconds
  private static readonly SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'fr', 'de', 'es', 'it', 'pt'] // Major languages

  /**
   * Get upcoming movies with specified sorting
   */
  static async getUpcomingMovies(
    sortBy: 'popularity' | 'release_date' = 'popularity',
    page: number = 1,
    limit: number = 20
  ): Promise<{
    movies: TMDBMovie[]
    pagination: {
      currentPage: number
      totalPages: number
      totalMovies: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }> {
    // Try to get from cache first
    const cacheKey = sortBy === 'popularity'
      ? this.CACHE_KEY_POPULARITY
      : this.CACHE_KEY_RELEASE_DATE

    let movies = await CacheService.get<TMDBMovie[]>(cacheKey)
    let metadata = await CacheService.get<{ totalCount: number }>(this.CACHE_KEY_METADATA)

    // If cache miss, build the cache
    if (!movies || !metadata) {
      console.log('Cache miss - building upcoming movies cache...')
      const buildResult = await this.buildCache()

      if (!buildResult.success || !buildResult.data) {
        throw new Error(`Failed to build upcoming movies cache: ${buildResult.error}`)
      }

      movies = sortBy === 'popularity'
        ? buildResult.data.popularitySorted
        : buildResult.data.releaseDateSorted
      metadata = { totalCount: buildResult.data.totalCount }
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMovies = movies.slice(startIndex, endIndex)
    const totalPages = Math.ceil(metadata.totalCount / limit)

    return {
      movies: paginatedMovies,
      pagination: {
        currentPage: page,
        totalPages,
        totalMovies: metadata.totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
  }

  /**
   * Build the cache using date-driven discovery with hybrid strategy
   */
  static async buildCache(): Promise<CacheBuildResult> {
    const stats = {
      totalFetched: 0,
      totalPages: 0,
      duplicatesRemoved: 0,
      moviesWithin6Months: 0,
      foundMoviesBeyondCutoff: false
    }

    try {
      // Calculate dynamic 6-month date range
      const today = new Date()
      const sixMonthsCutoff = new Date()
      sixMonthsCutoff.setMonth(today.getMonth() + 6)

      const startDate = today.toISOString().split('T')[0]
      const endDate = sixMonthsCutoff.toISOString().split('T')[0]

      console.log(`Building cache for date range: ${startDate} to ${endDate}`)

      const allMovies: TMDBMovie[] = []
      const seenMovieIds = new Set<number>()

      // Hybrid Strategy: Fetch both popularity-sorted and date-sorted results
      for (const language of this.SUPPORTED_LANGUAGES) {
        console.log(`Fetching movies for language: ${language}`)

        // Strategy 1: Get popularity-sorted movies (for quality)
        await this.fetchMoviesByStrategy(
          'popularity.desc',
          startDate,
          endDate,
          language,
          sixMonthsCutoff,
          allMovies,
          seenMovieIds,
          stats
        )

        // Strategy 2: Get date-sorted movies (for completeness)
        await this.fetchMoviesByStrategy(
          'primary_release_date.asc',
          startDate,
          endDate,
          language,
          sixMonthsCutoff,
          allMovies,
          seenMovieIds,
          stats
        )
      }

      // Filter and validate movies
      const validMovies = this.filterAndValidateMovies(allMovies, today, sixMonthsCutoff)
      stats.moviesWithin6Months = validMovies.length

      console.log(`Cache build completed:`, {
        totalFetched: stats.totalFetched,
        duplicatesRemoved: stats.duplicatesRemoved,
        validMovies: validMovies.length,
        languages: this.SUPPORTED_LANGUAGES.join(', '),
        dateRange: `${startDate} to ${endDate}`
      })

      // Create sorted datasets
      const popularitySorted = [...validMovies].sort((a, b) => b.popularity - a.popularity)
      const releaseDateSorted = [...validMovies].sort((a, b) =>
        new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
      )

      const cacheData: UpcomingCacheData = {
        popularitySorted,
        releaseDateSorted,
        totalCount: validMovies.length,
        cacheBuiltAt: new Date().toISOString(),
        dateRangeEnd: sixMonthsCutoff.toISOString()
      }

      // Store in cache
      await Promise.all([
        CacheService.set(this.CACHE_KEY_POPULARITY, cacheData.popularitySorted, this.CACHE_TTL),
        CacheService.set(this.CACHE_KEY_RELEASE_DATE, cacheData.releaseDateSorted, this.CACHE_TTL),
        CacheService.set(this.CACHE_KEY_METADATA, {
          totalCount: cacheData.totalCount,
          cacheBuiltAt: cacheData.cacheBuiltAt,
          dateRangeEnd: cacheData.dateRangeEnd
        }, this.CACHE_TTL)
      ])

      return {
        success: true,
        data: cacheData,
        stats
      }

    } catch (error) {
      console.error('Error building upcoming movies cache:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stats
      }
    }
  }

  /**
   * Fetch movies using a specific strategy (popularity or date sorting)
   */
  private static async fetchMoviesByStrategy(
    sortBy: 'popularity.desc' | 'primary_release_date.asc',
    startDate: string,
    endDate: string,
    language: string,
    sixMonthsCutoff: Date,
    allMovies: TMDBMovie[],
    seenMovieIds: Set<number>,
    stats: any
  ): Promise<void> {
    let page = 1
    let reachedDateBoundary = false

    while (!reachedDateBoundary) {
      try {
        const response: TMDBSearchResponse = await tmdbService.getDiscoverMoviesByDateRange({
          startDate,
          endDate,
          sortBy,
          language,
          page
        })

        stats.totalPages++

        if (!response.results || response.results.length === 0) {
          console.log(`No more results for ${language}/${sortBy} at page ${page}`)
          break
        }

        // Check if we've reached our date boundary (for date-sorted strategy)
        if (sortBy === 'primary_release_date.asc') {
          for (const movie of response.results) {
            if (movie.release_date && new Date(movie.release_date) > sixMonthsCutoff) {
              reachedDateBoundary = true
              stats.foundMoviesBeyondCutoff = true
              break
            }
          }
        }

        // Add movies to collection (with deduplication)
        for (const movie of response.results) {
          if (seenMovieIds.has(movie.id)) {
            stats.duplicatesRemoved++
            continue
          }

          // Basic validation
          if (!movie.release_date || !movie.title) {
            continue
          }

          seenMovieIds.add(movie.id)
          allMovies.push(movie)
          stats.totalFetched++
        }

        // For popularity sorting, limit to reasonable number of pages per language
        if (sortBy === 'popularity.desc' && page >= 5) {
          break
        }

        // For date sorting, limit to avoid excessive fetching
        if (sortBy === 'primary_release_date.asc' && page >= 15) {
          break
        }

        page++

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 250))

      } catch (error) {
        console.error(`Error fetching ${language}/${sortBy} page ${page}:`, error)
        break
      }
    }
  }

  /**
   * Filter and validate movies for quality and date requirements
   */
  private static filterAndValidateMovies(
    allMovies: TMDBMovie[],
    today: Date,
    sixMonthsCutoff: Date
  ): TMDBMovie[] {
    const todayStart = new Date(today)
    todayStart.setHours(0, 0, 0, 0)

    return allMovies.filter(movie => {
      const releaseDate = movie.release_date
      if (!releaseDate || isNaN(new Date(releaseDate).getTime())) {
        return false
      }

      const movieDate = new Date(releaseDate)

      // Must be in the future
      if (movieDate <= todayStart) {
        return false
      }

      // Must be within 6 months
      if (movieDate > sixMonthsCutoff) {
        return false
      }

      // Basic quality filters
      const releaseYear = movieDate.getFullYear()
      const currentYear = new Date().getFullYear()

      // Skip obvious re-releases (high vote count with future release date)
      if (movie.vote_count > 1500 && releaseYear <= currentYear + 1) {
        return false
      }

      // Skip very old movies being re-released
      if (releaseYear < currentYear - 1) {
        return false
      }

      return true
    })
  }

  /**
   * Force rebuild the cache (useful for testing or manual refresh)
   */
  static async rebuildCache(): Promise<CacheBuildResult> {
    // Clear existing cache
    await Promise.all([
      CacheService.del(this.CACHE_KEY_POPULARITY),
      CacheService.del(this.CACHE_KEY_RELEASE_DATE),
      CacheService.del(this.CACHE_KEY_METADATA)
    ])

    return this.buildCache()
  }

  /**
   * Get cache metadata and stats
   */
  static async getCacheInfo(): Promise<{
    isCached: boolean
    metadata?: any
    ageInHours?: number
  }> {
    const metadata = await CacheService.get(this.CACHE_KEY_METADATA)

    if (!metadata) {
      return { isCached: false }
    }

    const cacheBuiltAt = new Date(metadata.cacheBuiltAt)
    const ageInHours = (Date.now() - cacheBuiltAt.getTime()) / (1000 * 60 * 60)

    return {
      isCached: true,
      metadata,
      ageInHours
    }
  }
}

export { UpcomingCacheService }