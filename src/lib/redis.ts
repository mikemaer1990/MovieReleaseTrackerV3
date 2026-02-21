import { Redis } from '@upstash/redis'

// Create Redis instance lazily to avoid client-side initialization
let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      throw new Error('Missing env.UPSTASH_REDIS_REST_URL')
    }
    if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Missing env.UPSTASH_REDIS_REST_TOKEN')
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

// Cache keys
export const CACHE_KEYS = {
  movie: (tmdbId: number) => `movie:${tmdbId}`,
  movieDetails: (tmdbId: number) => `movie:details:${tmdbId}`,
  searchResults: (query: string) => `search:${query}`,
  userFollows: (userId: string) => `user:follows:${userId}`,
  releaseDates: (tmdbId: number) => `release_dates:${tmdbId}`,
  upcomingMovies: () => 'upcoming:movies',
  popularMovies: () => 'popular:movies',
} as const

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  short: 300, // 5 minutes
  medium: 1800, // 30 minutes
  long: 3600, // 1 hour
  day: 86400, // 24 hours
  week: 604800, // 7 days
} as const

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const redisClient = getRedis()
      const result = await redisClient.get(key)
      return result as T | null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  static async set<T>(key: string, value: T, ttl: number = CACHE_TTL.medium): Promise<void> {
    try {
      const redisClient = getRedis()
      await redisClient.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  static async del(key: string): Promise<void> {
    try {
      const redisClient = getRedis()
      await redisClient.del(key)
    } catch (error) {
      console.error('Redis del error:', error)
    }
  }
}