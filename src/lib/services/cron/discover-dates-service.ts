import { createSupabaseAdmin } from '@/lib/supabase'
import { tmdbService } from '@/lib/tmdb'
import { emailService } from '@/lib/services/email-service'

interface Follow {
  id: string
  user_id: string
  movie_id: number
  follow_type: 'THEATRICAL' | 'STREAMING' | 'BOTH'
  user: {
    id: string
    email: string
    name: string | null
  }
  movie: {
    id: number
    title: string
    poster_path: string | null
    release_dates: Array<{
      country: string
      release_type: number
      release_date: string
    }>
  }
}

interface MovieWithNewDates {
  movieId: number
  title: string
  posterPath: string | null
  theatricalDate: string | null
  streamingDate: string | null
}

interface UserNotification {
  userId: string
  email: string
  name: string | null
  movies: MovieWithNewDates[]
}

/**
 * Date Discovery Cron Job
 *
 * Runs daily at 3:00 AM to find missing release dates for followed movies.
 * Fetches fresh data from TMDB and notifies users when dates are discovered.
 */
export class DiscoverDatesService {
  /**
   * Execute the date discovery job
   */
  async execute(): Promise<{
    success: boolean
    moviesProcessed: number
    datesDiscovered: number
    emailsSent: number
    errors: Array<{ movieId: number; error: string }>
  }> {
    const supabase = createSupabaseAdmin()
    const errors: Array<{ movieId: number; error: string }> = []
    let moviesProcessed = 0
    let datesDiscovered = 0

    try {
      // Step 1: Get all follows with their movie's current release dates
      console.log('[DiscoverDatesService] Fetching follows...')
      const { data: allFollows, error: followsError } = await supabase
        .from('follows')
        .select(`
          id,
          user_id,
          movie_id,
          follow_type,
          user:users!inner (
            id,
            email,
            name
          ),
          movie:movies!inner (
            id,
            title,
            poster_path,
            release_dates (
              country,
              release_type,
              release_date
            )
          )
        `)

      if (followsError) throw followsError

      const follows = allFollows as unknown as Follow[]
      console.log(`[DiscoverDatesService] Found ${follows.length} total follows`)

      // Step 2: Filter for follows that need dates
      const followsNeedingDates = follows.filter(follow => {
        const usReleaseDates = follow.movie.release_dates?.filter(rd => rd.country === 'US') || []
        const hasTheatrical = usReleaseDates.some(rd => rd.release_type === 3)
        const hasStreaming = usReleaseDates.some(rd => rd.release_type === 4)

        if (follow.follow_type === 'THEATRICAL') return !hasTheatrical
        if (follow.follow_type === 'STREAMING') return !hasStreaming
        if (follow.follow_type === 'BOTH') return !hasTheatrical || !hasStreaming
        return false
      })

      console.log(`[DiscoverDatesService] ${followsNeedingDates.length} follows need dates`)

      if (followsNeedingDates.length === 0) {
        return {
          success: true,
          moviesProcessed: 0,
          datesDiscovered: 0,
          emailsSent: 0,
          errors: []
        }
      }

      // Step 3: Get unique movie IDs to fetch from TMDB
      const uniqueMovieIds = [...new Set(followsNeedingDates.map(f => f.movie_id))]
      console.log(`[DiscoverDatesService] Fetching ${uniqueMovieIds.length} unique movies from TMDB`)

      // Step 4: Fetch fresh release dates from TMDB with rate limiting
      const updatedMovies: Map<number, MovieWithNewDates> = new Map()

      for (let i = 0; i < uniqueMovieIds.length; i++) {
        const movieId = uniqueMovieIds[i]

        try {
          // Fetch fresh movie details from TMDB
          const movieDetails = await tmdbService.getMovieDetails(movieId)
          const releaseDates = movieDetails.release_dates?.results || []

          // Find US release dates
          const usReleases = releaseDates.find((rd) => rd.iso_3166_1 === 'US')
          const usReleaseDates = usReleases?.release_dates || []

          // Extract theatrical (type 3) and streaming (type 4) dates
          const theatrical = usReleaseDates.find((rd) => rd.type === 3)
          const streaming = usReleaseDates.find((rd) => rd.type === 4)

          const theatricalDate = theatrical?.release_date?.split('T')[0] || null
          const streamingDate = streaming?.release_date?.split('T')[0] || null

          // Check if we found any new dates
          const follow = followsNeedingDates.find(f => f.movie_id === movieId)
          const currentUsReleaseDates = follow?.movie.release_dates?.filter(rd => rd.country === 'US') || []
          const hadTheatrical = currentUsReleaseDates.some(rd => rd.release_type === 3)
          const hadStreaming = currentUsReleaseDates.some(rd => rd.release_type === 4)

          // Get current date (in UTC, formatted as YYYY-MM-DD)
          const today = new Date().toISOString().split('T')[0]

          // Check if dates are new AND in the future (don't notify for past dates)
          const hasNewTheatrical = !hadTheatrical && theatricalDate !== null && theatricalDate > today
          const hasNewStreaming = !hadStreaming && streamingDate !== null && streamingDate > today

          if (hasNewTheatrical || hasNewStreaming) {
            updatedMovies.set(movieId, {
              movieId,
              title: movieDetails.title,
              posterPath: movieDetails.poster_path,
              theatricalDate: hasNewTheatrical ? theatricalDate : null,
              streamingDate: hasNewStreaming ? streamingDate : null
            })

            // Step 5: Update release_dates table
            const releaseDateRecords = []

            if (hasNewTheatrical && theatricalDate) {
              releaseDateRecords.push({
                movie_id: movieId,
                country: 'US',
                release_type: 3,
                release_date: theatricalDate
              })
            }

            if (hasNewStreaming && streamingDate) {
              releaseDateRecords.push({
                movie_id: movieId,
                country: 'US',
                release_type: 4,
                release_date: streamingDate
              })
            }

            if (releaseDateRecords.length > 0) {
              const { error: upsertError } = await supabase
                .from('release_dates')
                .upsert(releaseDateRecords, {
                  onConflict: 'movie_id,country,release_type'
                })

              if (upsertError) {
                console.error(`[DiscoverDatesService] Failed to upsert release dates for movie ${movieId}:`, upsertError)
                errors.push({ movieId, error: upsertError.message })
              } else {
                datesDiscovered += releaseDateRecords.length
              }
            }
          }

          moviesProcessed++

          // Rate limit: 250ms between requests (except last one)
          if (i < uniqueMovieIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 250))
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`[DiscoverDatesService] Failed to fetch movie ${movieId}:`, errorMessage)
          errors.push({ movieId, error: errorMessage })
        }
      }

      console.log(`[DiscoverDatesService] Discovered ${datesDiscovered} new dates for ${updatedMovies.size} movies`)

      if (updatedMovies.size === 0) {
        return {
          success: true,
          moviesProcessed,
          datesDiscovered: 0,
          emailsSent: 0,
          errors
        }
      }

      // Step 6: Check for existing notifications to prevent duplicates
      const userIds = [...new Set(followsNeedingDates.map(f => f.user_id))]
      const movieIds = [...updatedMovies.keys()]

      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('user_id, movie_id')
        .eq('notification_type', 'DATE_DISCOVERED')
        .in('user_id', userIds)
        .in('movie_id', movieIds)

      const notifiedSet = new Set(
        existingNotifications?.map(n => `${n.user_id}:${n.movie_id}`) || []
      )

      // Step 7: Group notifications by user email
      const notificationsByUser = new Map<string, UserNotification>()

      for (const follow of followsNeedingDates) {
        const movieData = updatedMovies.get(follow.movie_id)
        if (!movieData) continue

        // Skip if already notified
        const notificationKey = `${follow.user_id}:${follow.movie_id}`
        if (notifiedSet.has(notificationKey)) continue

        // Check if this movie's new dates match the user's follow type
        const needsTheatrical = (follow.follow_type === 'THEATRICAL' || follow.follow_type === 'BOTH')
        const needsStreaming = (follow.follow_type === 'STREAMING' || follow.follow_type === 'BOTH')

        const hasRelevantDate =
          (needsTheatrical && movieData.theatricalDate) ||
          (needsStreaming && movieData.streamingDate)

        if (!hasRelevantDate) continue

        const userKey = follow.user.email
        if (!notificationsByUser.has(userKey)) {
          notificationsByUser.set(userKey, {
            userId: follow.user_id,
            email: follow.user.email,
            name: follow.user.name,
            movies: []
          })
        }

        notificationsByUser.get(userKey)!.movies.push(movieData)
      }

      console.log(`[DiscoverDatesService] Sending emails to ${notificationsByUser.size} users`)

      // Step 8: Send batched emails
      let emailsSent = 0
      const notificationRecords = []

      for (const [email, userData] of notificationsByUser) {
        try {
          const user = { email: userData.email, name: userData.name }

          // Send single or batch email based on count
          if (userData.movies.length === 1) {
            const movie = userData.movies[0]
            await emailService.sendDateDiscoveredEmail(user, {
              movie: {
                id: movie.movieId,
                title: movie.title,
                posterPath: movie.posterPath,
                overview: '',
                releaseDate: '',
                voteAverage: 0,
                popularity: 0,
                genres: null,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              theatricalDate: movie.theatricalDate,
              streamingDate: movie.streamingDate
            })
          } else {
            const moviesWithDates = userData.movies.map(m => ({
              movie: {
                id: m.movieId,
                title: m.title,
                posterPath: m.posterPath,
                overview: '',
                releaseDate: '',
                voteAverage: 0,
                popularity: 0,
                genres: null,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              theatricalDate: m.theatricalDate,
              streamingDate: m.streamingDate
            }))
            await emailService.sendBatchDateDiscoveredEmail(user, moviesWithDates)
          }

          emailsSent++

          // Record notifications
          for (const movie of userData.movies) {
            notificationRecords.push({
              user_id: userData.userId,
              movie_id: movie.movieId,
              notification_type: 'DATE_DISCOVERED',
              email_status: 'SENT',
              metadata: {
                theatrical_date: movie.theatricalDate,
                streaming_date: movie.streamingDate
              }
            })
          }
        } catch (error) {
          console.error(`[DiscoverDatesService] Failed to send email to ${email}:`, error)
        }
      }

      // Step 9: Record notifications in database
      if (notificationRecords.length > 0) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notificationRecords)

        if (notificationError) {
          console.error('[DiscoverDatesService] Failed to record notifications:', notificationError)
        }
      }

      console.log(`[DiscoverDatesService] Complete! Sent ${emailsSent} emails, discovered ${datesDiscovered} dates`)

      return {
        success: true,
        moviesProcessed,
        datesDiscovered,
        emailsSent,
        errors
      }
    } catch (error) {
      console.error('[DiscoverDatesService] Fatal error:', error)
      throw error
    }
  }
}

// Export singleton
export const discoverDatesService = new DiscoverDatesService()
