import { OMDBResponse, MovieRatings } from '@/types/movie'

const OMDB_BASE_URL = 'http://www.omdbapi.com/'

class OMDBService {
  private apiKey: string | null = null

  private getApiKey(): string {
    if (!this.apiKey) {
      if (!process.env.OMDB_API_KEY) {
        throw new Error('Missing env.OMDB_API_KEY')
      }
      this.apiKey = process.env.OMDB_API_KEY
    }
    return this.apiKey
  }

  /**
   * Fetch movie details from OMDB by IMDb ID
   */
  async getMovieByImdbId(imdbId: string): Promise<OMDBResponse | null> {
    try {
      const apiKey = this.getApiKey()
      const url = `${OMDB_BASE_URL}?apikey=${apiKey}&i=${imdbId}&plot=short`

      const response = await fetch(url)
      if (!response.ok) {
        console.error(`OMDB API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data: OMDBResponse = await response.json()

      if (data.Response === 'False') {
        console.error(`OMDB API error: ${data.Error}`)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching from OMDB:', error)
      return null
    }
  }

  /**
   * Extract and format ratings from OMDB response
   */
  parseRatings(omdbData: OMDBResponse | null, imdbId: string): Partial<MovieRatings> {
    if (!omdbData) {
      return {}
    }

    const ratings: Partial<MovieRatings> = {}

    // IMDb rating
    if (omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
      ratings.imdb = {
        score: omdbData.imdbRating,
        url: `https://www.imdb.com/title/${imdbId}/`,
      }
    }

    // Parse ratings array for Rotten Tomatoes and Metacritic
    if (omdbData.Ratings && omdbData.Ratings.length > 0) {
      omdbData.Ratings.forEach((rating) => {
        if (rating.Source === 'Rotten Tomatoes' && rating.Value !== 'N/A') {
          // Try to construct RT URL from title (basic slug generation)
          const slug = omdbData.Title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')

          ratings.rottenTomatoes = {
            score: rating.Value,
            url: `https://www.rottentomatoes.com/m/${slug}`,
          }
        }

        if (rating.Source === 'Metacritic' && rating.Value !== 'N/A') {
          // Try to construct Metacritic URL from title
          const slug = omdbData.Title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

          ratings.metacritic = {
            score: rating.Value,
            url: `https://www.metacritic.com/movie/${slug}`,
          }
        }
      })
    }

    // Fallback to Metascore if not in Ratings array
    if (!ratings.metacritic && omdbData.Metascore && omdbData.Metascore !== 'N/A') {
      const slug = omdbData.Title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      ratings.metacritic = {
        score: `${omdbData.Metascore}/100`,
        url: `https://www.metacritic.com/movie/${slug}`,
      }
    }

    return ratings
  }

  /**
   * Get ratings for a movie by IMDb ID
   * Returns only the ratings data we need
   */
  async getRatingsByImdbId(imdbId: string): Promise<Partial<MovieRatings>> {
    const omdbData = await this.getMovieByImdbId(imdbId)
    return this.parseRatings(omdbData, imdbId)
  }
}

export const omdbService = new OMDBService()
export { OMDBService }
