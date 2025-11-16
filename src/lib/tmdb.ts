import {
  TMDBMovie,
  TMDBMovieDetails,
  TMDBSearchResponse,
  UnifiedReleaseDates,
  TMDBReleaseDateResult,
  TMDBEnhancedMovieDetails
} from '@/types/movie'
import { CacheService, CACHE_KEYS, CACHE_TTL } from './redis'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

class TMDBService {
  private apiKey: string | null = null
  private baseURL: string

  constructor() {
    this.baseURL = TMDB_BASE_URL
  }
  
  private getApiKey(): string {
    if (!this.apiKey) {
      if (!process.env.TMDB_API_KEY) {
        throw new Error('Missing env.TMDB_API_KEY')
      }
      this.apiKey = process.env.TMDB_API_KEY
    }
    return this.apiKey
  }

  private async fetchWithCache<T>(
    url: string,
    cacheKey: string,
    ttl: number = CACHE_TTL.long
  ): Promise<T> {
    const start = Date.now()

    // Try cache first
    const cached = await CacheService.get<T>(cacheKey)
    if (cached) {
      console.log(`[PERF] TMDB cache HIT for ${cacheKey} (${Date.now() - start}ms)`)
      return cached
    }

    console.log(`[PERF] TMDB cache MISS for ${cacheKey}, fetching from API...`)
    const apiStart = Date.now()

    // Fetch from API
    const apiKey = this.getApiKey()
    const response = await fetch(`${this.baseURL}${url}&api_key=${apiKey}`)
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
    }

    const data: T = await response.json()
    const apiDuration = Date.now() - apiStart
    console.log(`[PERF] TMDB API call took ${apiDuration}ms`)

    // Cache the result
    await CacheService.set(cacheKey, data, ttl)

    return data
  }

  async searchMovies(query: string, page: number = 1): Promise<TMDBSearchResponse> {
    const cacheKey = `${CACHE_KEYS.searchResults(query)}:page:${page}`
    const url = `/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`

    return this.fetchWithCache<TMDBSearchResponse>(url, cacheKey, CACHE_TTL.medium)
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    const cacheKey = CACHE_KEYS.movieDetails(movieId)
    const url = `/movie/${movieId}?append_to_response=release_dates`

    return this.fetchWithCache<TMDBMovieDetails>(url, cacheKey, CACHE_TTL.day)
  }

  async getEnhancedMovieDetails(movieId: number): Promise<TMDBEnhancedMovieDetails> {
    const cacheKey = `${CACHE_KEYS.movieDetails(movieId)}:enhanced`
    const url = `/movie/${movieId}?append_to_response=credits,videos,images,watch/providers,similar,recommendations,reviews,release_dates,external_ids`

    return this.fetchWithCache<TMDBEnhancedMovieDetails>(url, cacheKey, CACHE_TTL.day)
  }

  async getPopularMovies(page: number = 1): Promise<TMDBSearchResponse> {
    const cacheKey = `${CACHE_KEYS.popularMovies()}:page:${page}`
    const url = `/movie/popular?page=${page}&include_adult=false`

    return this.fetchWithCache<TMDBSearchResponse>(url, cacheKey, CACHE_TTL.long)
  }

  async getPopularMoviesWithDates(page: number = 1): Promise<TMDBSearchResponse> {
    const cacheKey = `${CACHE_KEYS.popularMovies()}:enriched:page:${page}`
    const url = `/movie/popular?page=${page}`

    return this.fetchWithCache<TMDBSearchResponse>(url, cacheKey, CACHE_TTL.long)
  }

  async getUpcomingMovies(page: number = 1): Promise<TMDBSearchResponse> {
    const cacheKey = `${CACHE_KEYS.upcomingMovies()}:page:${page}`
    const url = `/movie/upcoming?page=${page}&include_adult=false`

    return this.fetchWithCache<TMDBSearchResponse>(url, cacheKey, CACHE_TTL.medium)
  }

  async getDiscoverMovies(params: {
    genre?: number
    year?: number
    sortBy?: string
    page?: number
  }): Promise<TMDBSearchResponse> {
    const { genre, year, sortBy = 'popularity.desc', page = 1 } = params
    const searchParams = new URLSearchParams({
      sort_by: sortBy,
      page: page.toString(),
      include_adult: 'false',
    })

    if (genre) searchParams.append('with_genres', genre.toString())
    if (year) searchParams.append('year', year.toString())

    const url = `/discover/movie?${searchParams.toString()}`
    const cacheKey = `discover:${searchParams.toString()}`

    return this.fetchWithCache<TMDBSearchResponse>(url, cacheKey, CACHE_TTL.long)
  }

  async getDiscoverMoviesByDateRange(params: {
    startDate: string
    endDate: string
    sortBy?: 'popularity.desc' | 'primary_release_date.asc'
    language?: string
    page?: number
  }): Promise<TMDBSearchResponse> {
    const {
      startDate,
      endDate,
      sortBy = 'popularity.desc',
      language = 'en',
      page = 1
    } = params

    const searchParams = new URLSearchParams({
      'primary_release_date.gte': startDate,
      'primary_release_date.lte': endDate,
      'with_original_language': language,
      'sort_by': sortBy,
      'page': page.toString(),
      'include_adult': 'false',
    })

    const url = `/discover/movie?${searchParams.toString()}`
    const cacheKey = `discover_range:${searchParams.toString()}`

    return this.fetchWithCache<TMDBSearchResponse>(url, cacheKey, CACHE_TTL.medium)
  }

  async getRecentDigitalReleases(params?: {
    daysBack?: number
    voteCountMin?: number
    voteAverageMin?: number
    page?: number
  }): Promise<TMDBSearchResponse> {
    const {
      daysBack = 60,
      voteCountMin = 50,
      voteAverageMin = 6.5,
      page = 1
    } = params || {}

    // Calculate date range (last N days)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    const searchParams = new URLSearchParams({
      'release_date.gte': formatDate(startDate),
      'release_date.lte': formatDate(endDate),
      'with_release_type': '4|5|6', // Digital (4), Physical (5), TV/Streaming (6)
      'with_original_language': 'en|es|fr|de|ja|ko|it|pt', // Major languages
      'vote_count.gte': voteCountMin.toString(),
      'vote_average.gte': voteAverageMin.toString(),
      'sort_by': 'release_date.desc',
      'page': page.toString(),
      'include_adult': 'false',
    })

    const url = `/discover/movie?${searchParams.toString()}`
    const cacheKey = `recent_digital:${searchParams.toString()}`

    return this.fetchWithCache<TMDBSearchResponse>(url, cacheKey, CACHE_TTL.medium)
  }

  /**
   * Get unified release dates from TMDB data
   * Implements the same logic from the original project
   */
  getUnifiedReleaseDates(releaseDatesResponse?: { results: TMDBReleaseDateResult[] }): UnifiedReleaseDates {
    const defaultDates: UnifiedReleaseDates = {
      usTheatrical: null,
      streaming: null,
      primary: null,
      limited: null,
      digital: null,
    }

    if (!releaseDatesResponse?.results) {
      return defaultDates
    }

    // Find US release dates
    const usReleases = releaseDatesResponse.results.find(r => r.iso_3166_1 === 'US')
    
    if (!usReleases?.release_dates) {
      return defaultDates
    }

    const dates = { ...defaultDates }

    // Process US release dates
    for (const release of usReleases.release_dates) {
      const date = release.release_date.split('T')[0] // Extract date part
      
      switch (release.type) {
        case 1: // Premiere
          if (!dates.primary) dates.primary = date
          break
        case 2: // Theatrical (limited)
          if (!dates.limited) dates.limited = date
          if (!dates.usTheatrical) dates.usTheatrical = date
          break
        case 3: // Theatrical
          dates.usTheatrical = date // Always prioritize wide theatrical
          break
        case 4: // Digital
          if (!dates.digital) dates.digital = date
          if (!dates.streaming) dates.streaming = date
          break
        case 5: // Physical
          if (!dates.streaming) dates.streaming = date
          break
        case 6: // TV
          if (!dates.streaming) dates.streaming = date
          break
      }
    }

    return dates
  }

  /**
   * Get poster URL with different sizes
   */
  getPosterUrl(posterPath: string | null, size: 'w154' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'): string | null {
    if (!posterPath) return null
    return `${TMDB_IMAGE_BASE_URL}/${size}${posterPath}`
  }

  /**
   * Get backdrop URL with different sizes
   */
  getBackdropUrl(backdropPath: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    if (!backdropPath) return null
    return `${TMDB_IMAGE_BASE_URL}/${size}${backdropPath}`
  }

  /**
   * Get profile image URL with different sizes
   */
  getProfileUrl(profilePath: string | null, size: 'w45' | 'w185' | 'h632' | 'original' = 'w185'): string | null {
    if (!profilePath) return null
    return `${TMDB_IMAGE_BASE_URL}/${size}${profilePath}`
  }

  /**
   * Get logo URL with different sizes
   */
  getLogoUrl(logoPath: string | null, size: 'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'w500' | 'original' = 'w154'): string | null {
    if (!logoPath) return null
    return `${TMDB_IMAGE_BASE_URL}/${size}${logoPath}`
  }
}

export const tmdbService = new TMDBService()
export { TMDBService }