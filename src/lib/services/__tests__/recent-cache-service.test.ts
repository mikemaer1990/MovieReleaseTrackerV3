import { TMDBMovie, TMDBSearchResponse } from '@/types/movie'

jest.mock('@/lib/tmdb', () => ({
  tmdbService: {
    getRecentDigitalReleases: jest.fn(),
  },
}))

jest.mock('@/lib/tmdb-utils', () => ({
  enrichMoviesWithDatesFast: jest.fn(),
}))

jest.mock('@/lib/redis', () => ({
  CacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
}))

import { RecentCacheService } from '../recent-cache-service'
import { tmdbService } from '@/lib/tmdb'
import { enrichMoviesWithDatesFast } from '@/lib/tmdb-utils'
import { CacheService } from '@/lib/redis'

// --- helpers ---

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function makeMovie(id: number, adult = false): TMDBMovie {
  return {
    id,
    title: `Movie ${id}`,
    overview: '',
    poster_path: null,
    backdrop_path: null,
    release_date: daysAgo(30),
    genre_ids: [],
    popularity: 100,
    vote_average: 7.0,
    vote_count: 100,
    adult,
    original_language: 'en',
    original_title: `Movie ${id}`,
  }
}

function makeSearchResponse(movies: TMDBMovie[]): TMDBSearchResponse {
  return { page: 1, results: movies, total_pages: 10, total_results: movies.length }
}

// Makes enrichMoviesWithDatesFast return each movie with a given digital date
function mockEnrichReturnsDate(digitalDate: string | null) {
  ;(enrichMoviesWithDatesFast as jest.Mock).mockImplementation(
    async (movies: TMDBMovie[]) =>
      movies.map(m => ({ ...m, unifiedDates: { digital: digitalDate, streaming: null, usTheatrical: null, primary: null, limited: null } }))
  )
}

const mockGetPages = tmdbService.getRecentDigitalReleases as jest.Mock
const mockEnrich = enrichMoviesWithDatesFast as jest.Mock
const mockCacheSet = CacheService.set as jest.Mock

// --- tests ---

beforeEach(() => {
  jest.clearAllMocks()
  ;(CacheService.get as jest.Mock).mockResolvedValue(null)
  mockCacheSet.mockResolvedValue(undefined)
})

describe('RecentCacheService.buildCache', () => {
  describe('no re-enrichment (core bug fix)', () => {
    it('enriches each page only once, never re-enriches previous pages', async () => {
      const page1Movies = [makeMovie(1), makeMovie(2), makeMovie(3)]
      const page2Movies = [makeMovie(4), makeMovie(5), makeMovie(6)]

      mockGetPages
        .mockResolvedValueOnce(makeSearchResponse(page1Movies))
        .mockResolvedValueOnce(makeSearchResponse(page2Movies))
        .mockResolvedValueOnce(makeSearchResponse([]))  // stops loop

      mockEnrich.mockImplementation(async (movies: TMDBMovie[]) =>
        movies.map(m => ({
          ...m,
          unifiedDates: { digital: daysAgo(10), streaming: null, usTheatrical: null, primary: null, limited: null },
        }))
      )

      await RecentCacheService.buildCache()

      expect(mockEnrich).toHaveBeenCalledTimes(2)
      // First call: only page 1 movies
      expect(mockEnrich).toHaveBeenNthCalledWith(1, page1Movies)
      // Second call: only page 2 movies — NOT page1+page2 combined
      expect(mockEnrich).toHaveBeenNthCalledWith(2, page2Movies)
    })

    it('does NOT call enrich when a page returns only duplicates', async () => {
      const movies = [makeMovie(1), makeMovie(2)]

      mockGetPages
        .mockResolvedValueOnce(makeSearchResponse(movies))
        .mockResolvedValueOnce(makeSearchResponse(movies)) // same IDs = all duplicates
        .mockResolvedValueOnce(makeSearchResponse([]))

      mockEnrichReturnsDate(daysAgo(10))

      await RecentCacheService.buildCache()

      // Enrich called once for page 1; page 2 has no new movies so enrich is skipped
      expect(mockEnrich).toHaveBeenCalledTimes(1)
      expect(mockEnrich).toHaveBeenCalledWith(movies)
    })
  })

  describe('date window filtering', () => {
    it('includes movies with digital dates within the last 90 days', async () => {
      mockGetPages
        .mockResolvedValueOnce(makeSearchResponse([makeMovie(1)]))
        .mockResolvedValueOnce(makeSearchResponse([]))

      mockEnrichReturnsDate(daysAgo(45))  // 45 days ago — within window

      const result = await RecentCacheService.buildCache()

      expect(result.success).toBe(true)
      expect(result.stats.filteredCount).toBe(1)
    })

    it('excludes movies with digital dates older than 90 days', async () => {
      mockGetPages
        .mockResolvedValueOnce(makeSearchResponse([makeMovie(1)]))
        .mockResolvedValueOnce(makeSearchResponse([]))

      mockEnrichReturnsDate(daysAgo(95))  // 95 days ago — outside window

      const result = await RecentCacheService.buildCache()

      expect(result.success).toBe(true)
      expect(result.stats.filteredCount).toBe(0)
    })

    it('excludes movies with future digital dates', async () => {
      mockGetPages
        .mockResolvedValueOnce(makeSearchResponse([makeMovie(1)]))
        .mockResolvedValueOnce(makeSearchResponse([]))

      mockEnrichReturnsDate(tomorrow())

      const result = await RecentCacheService.buildCache()

      expect(result.success).toBe(true)
      expect(result.stats.filteredCount).toBe(0)
    })

    it('excludes movies with no digital or streaming date', async () => {
      mockGetPages
        .mockResolvedValueOnce(makeSearchResponse([makeMovie(1)]))
        .mockResolvedValueOnce(makeSearchResponse([]))

      mockEnrichReturnsDate(null)  // no date at all

      const result = await RecentCacheService.buildCache()

      expect(result.stats.filteredCount).toBe(0)
    })
  })

  describe('loop termination', () => {
    it('stops immediately when TMDB returns an empty page', async () => {
      mockGetPages.mockResolvedValueOnce(makeSearchResponse([]))

      mockEnrichReturnsDate(daysAgo(10))

      await RecentCacheService.buildCache()

      expect(mockGetPages).toHaveBeenCalledTimes(1)
      expect(mockEnrich).not.toHaveBeenCalled()
    })

    it('stops after hitting max pages (15)', async () => {
      // Always return 5 movies with no valid dates so filtered count never reaches 100
      const movies = [makeMovie(1), makeMovie(2), makeMovie(3), makeMovie(4), makeMovie(5)]
      mockGetPages.mockResolvedValue(makeSearchResponse(movies))
      mockEnrichReturnsDate(daysAgo(95))  // outside window so filteredCount stays 0

      await RecentCacheService.buildCache()

      expect(mockGetPages).toHaveBeenCalledTimes(15)
    })
  })

  describe('adult movie filtering', () => {
    it('excludes adult movies before enrichment', async () => {
      const adultMovie = makeMovie(99, true)
      const normalMovie = makeMovie(1, false)

      mockGetPages
        .mockResolvedValueOnce(makeSearchResponse([adultMovie, normalMovie]))
        .mockResolvedValueOnce(makeSearchResponse([]))

      mockEnrichReturnsDate(daysAgo(10))

      await RecentCacheService.buildCache()

      // enrich should only be called with the non-adult movie
      expect(mockEnrich).toHaveBeenCalledWith([normalMovie])
    })
  })

  describe('stats', () => {
    it('returns correct totalFetched and totalPages', async () => {
      const page1 = [makeMovie(1), makeMovie(2)]
      const page2 = [makeMovie(3), makeMovie(4), makeMovie(5)]

      mockGetPages
        .mockResolvedValueOnce(makeSearchResponse(page1))
        .mockResolvedValueOnce(makeSearchResponse(page2))
        .mockResolvedValueOnce(makeSearchResponse([]))

      mockEnrichReturnsDate(daysAgo(10))

      const result = await RecentCacheService.buildCache()

      expect(result.stats.totalFetched).toBe(5)   // 2 + 3
      expect(result.stats.totalPages).toBe(2)      // stopped after empty page 3
      expect(result.stats.filteredCount).toBe(5)
    })

    it('does not double-count duplicate movies in totalFetched', async () => {
      const movies = [makeMovie(1), makeMovie(2)]

      mockGetPages
        .mockResolvedValueOnce(makeSearchResponse(movies))
        .mockResolvedValueOnce(makeSearchResponse(movies))  // same IDs
        .mockResolvedValueOnce(makeSearchResponse([]))

      mockEnrichReturnsDate(daysAgo(10))

      const result = await RecentCacheService.buildCache()

      // Duplicates skipped, so only 2 unique movies fetched
      expect(result.stats.totalFetched).toBe(2)
    })
  })

  describe('sort order', () => {
    it('returns movies sorted by digital date newest first', async () => {
      const movies = [makeMovie(1), makeMovie(2), makeMovie(3)]

      mockGetPages
        .mockResolvedValueOnce(makeSearchResponse(movies))
        .mockResolvedValueOnce(makeSearchResponse([]))

      const dates = [daysAgo(30), daysAgo(5), daysAgo(15)]
      ;(mockEnrich as jest.Mock).mockResolvedValueOnce(
        movies.map((m, i) => ({
          ...m,
          unifiedDates: { digital: dates[i], streaming: null, usTheatrical: null, primary: null, limited: null },
        }))
      )

      const result = await RecentCacheService.buildCache()

      const resultDates = result.data!.movies.map(m => m.unifiedDates?.digital)
      expect(resultDates).toEqual([daysAgo(5), daysAgo(15), daysAgo(30)])
    })
  })

  describe('error handling', () => {
    it('returns success: false when TMDB throws', async () => {
      mockGetPages.mockRejectedValueOnce(new Error('TMDB API down'))

      const result = await RecentCacheService.buildCache()

      expect(result.success).toBe(false)
      expect(result.error).toBe('TMDB API down')
    })

    it('does not write to cache on failure', async () => {
      mockGetPages.mockRejectedValueOnce(new Error('Network error'))

      await RecentCacheService.buildCache()

      expect(mockCacheSet).not.toHaveBeenCalled()
    })
  })
})
