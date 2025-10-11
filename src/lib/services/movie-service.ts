import { supabase, createSupabaseAdmin } from '@/lib/supabase'
import { TMDBMovieDetails, UnifiedReleaseDates, ReleaseDate } from '@/types/movie'

export class MovieService {
  // Convert database release_dates array to UnifiedReleaseDates
  static buildUnifiedDatesFromDB(releaseDates: ReleaseDate[] | undefined): UnifiedReleaseDates {
    if (!releaseDates || releaseDates.length === 0) {
      return {
        usTheatrical: null,
        streaming: null,
        primary: null,
        limited: null,
        digital: null,
      }
    }

    const usReleases = releaseDates.filter(rd => rd.country === 'US')

    const theatrical = usReleases.find(rd => rd.releaseType === 3)?.releaseDate || null
    const limited = usReleases.find(rd => rd.releaseType === 2)?.releaseDate || null
    const streaming = usReleases.find(rd => rd.releaseType === 4)?.releaseDate || null
    const digital = usReleases.find(rd => rd.releaseType === 4)?.releaseDate || null

    return {
      usTheatrical: theatrical,
      streaming: streaming,
      primary: theatrical || limited || null,
      limited: limited,
      digital: digital,
    }
  }
  // Store movie in database (server-side only)
  static async storeMovie(movieData: TMDBMovieDetails, releaseDates: UnifiedReleaseDates) {
    const supabaseAdmin = createSupabaseAdmin()
    
    const { data, error } = await supabaseAdmin
      .from('movies')
      .upsert({
        id: movieData.id,
        title: movieData.title,
        poster_path: movieData.poster_path,
        release_date: movieData.release_date,
        overview: movieData.overview,
        genres: movieData.genres,
        popularity: movieData.popularity,
        vote_average: movieData.vote_average,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to store movie: ${error.message}`)
    }

    // Store release dates
    if (releaseDates.usTheatrical || releaseDates.streaming || releaseDates.primary) {
      const releaseDateRecords = []
      
      if (releaseDates.usTheatrical) {
        releaseDateRecords.push({
          movie_id: movieData.id,
          country: 'US',
          release_type: 3, // Theatrical
          release_date: releaseDates.usTheatrical,
        })
      }
      
      if (releaseDates.streaming) {
        releaseDateRecords.push({
          movie_id: movieData.id,
          country: 'US',
          release_type: 4, // Digital/Streaming
          release_date: releaseDates.streaming,
        })
      }

      if (releaseDateRecords.length > 0) {
        await supabaseAdmin
          .from('release_dates')
          .upsert(releaseDateRecords, {
            onConflict: 'movie_id,country,release_type'
          })
      }
    }

    return data
  }

  // Get movie from database
  static async getMovie(movieId: number) {
    const { data, error } = await supabase
      .from('movies')
      .select(`
        *,
        release_dates (*)
      `)
      .eq('id', movieId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to get movie: ${error.message}`)
    }

    return data
  }

  // Check if movie exists in database
  static async movieExists(movieId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('movies')
      .select('id')
      .eq('id', movieId)
      .single()

    return data !== null && !error
  }
}