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
      last_validated_at?: string | null
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
 * Date Discovery & Validation Cron Job
 *
 * Runs daily at 3:00 AM to:
 * 1. Find missing release dates for followed movies
 * 2. Validate existing future release dates (within 90 days)
 * 3. Notify users when dates are discovered or changed
 */
export class DiscoverDatesService {
  /**
   * Execute the date discovery and validation job
   */
  async execute(): Promise<{
    success: boolean
    moviesProcessed: number
    datesDiscovered: number
    datesValidated: number
    datesChanged: number
    emailsSent: number
    errors: Array<{ movieId: number; error: string }>
  }> {
    const supabase = createSupabaseAdmin()
    const errors: Array<{ movieId: number; error: string }> = []
    let moviesProcessed = 0
    let datesDiscovered = 0
    let datesValidated = 0
    let datesChanged = 0
    const today = new Date().toISOString().split('T')[0]
    const futureThreshold = new Date()
    futureThreshold.setDate(futureThreshold.getDate() + 90)
    const futureThresholdStr = futureThreshold.toISOString().split('T')[0]

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
              release_date,
              last_validated_at
            )
          )
        `)

      if (followsError) throw followsError

      const follows = allFollows as unknown as Follow[]
      console.log(`[DiscoverDatesService] Found ${follows.length} total follows`)

      // Step 2a: Filter for follows that need MISSING dates (discovery)
      const followsNeedingDates = follows.filter(follow => {
        const usReleaseDates = follow.movie.release_dates?.filter(rd => rd.country === 'US') || []
        const hasTheatrical = usReleaseDates.some(rd => rd.release_type === 3)
        const hasStreaming = usReleaseDates.some(rd => rd.release_type === 4)

        if (follow.follow_type === 'THEATRICAL') return !hasTheatrical
        if (follow.follow_type === 'STREAMING') return !hasStreaming
        if (follow.follow_type === 'BOTH') return !hasTheatrical || !hasStreaming
        return false
      })

      // Step 2b: Filter for follows that need VALIDATION (existing future dates)
      const followsNeedingValidation = follows.filter(follow => {
        const usReleaseDates = follow.movie.release_dates?.filter(rd => rd.country === 'US') || []

        return usReleaseDates.some(rd => {
          // Only validate future dates within 90 days
          if (rd.release_date <= today || rd.release_date > futureThresholdStr) return false

          // Validate if never checked or not checked in last 24 hours
          if (!rd.last_validated_at) return true
          const lastValidated = new Date(rd.last_validated_at)
          const hoursSinceValidation = (Date.now() - lastValidated.getTime()) / (1000 * 60 * 60)
          return hoursSinceValidation > 24
        })
      })

      console.log(`[DiscoverDatesService] ${followsNeedingDates.length} follows need dates, ${followsNeedingValidation.length} need validation`)

      // Combine both lists and get unique movie IDs
      const allFollowsToProcess = [...followsNeedingDates, ...followsNeedingValidation]

      if (allFollowsToProcess.length === 0) {
        return {
          success: true,
          moviesProcessed: 0,
          datesDiscovered: 0,
          datesValidated: 0,
          datesChanged: 0,
          emailsSent: 0,
          errors: []
        }
      }

      // Step 3: Get unique movie IDs to fetch from TMDB (limit to 50 per run for API safety)
      const allMovieIds = [...new Set(allFollowsToProcess.map(f => f.movie_id))]
      const uniqueMovieIds = allMovieIds.slice(0, 50)
      console.log(`[DiscoverDatesService] Fetching ${uniqueMovieIds.length} unique movies from TMDB (${allMovieIds.length - uniqueMovieIds.length} deferred)`)

      // Step 4: Fetch fresh release dates from TMDB with rate limiting
      const updatedMovies: Map<number, MovieWithNewDates> = new Map()
      const changedMovies: Map<number, { old: string, new: string, type: number }> = new Map()

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

          const theatricalDateFromTMDB = theatrical?.release_date?.split('T')[0] || null
          const streamingDateFromTMDB = streaming?.release_date?.split('T')[0] || null

          // Get current dates from database
          const follow = allFollowsToProcess.find(f => f.movie_id === movieId)
          const currentUsReleaseDates = follow?.movie.release_dates?.filter(rd => rd.country === 'US') || []
          const currentTheatricalDate = currentUsReleaseDates.find(rd => rd.release_type === 3)?.release_date || null
          const currentStreamingDate = currentUsReleaseDates.find(rd => rd.release_type === 4)?.release_date || null

          // Check for DISCOVERY (new dates)
          const hasNewTheatrical = !currentTheatricalDate && theatricalDateFromTMDB !== null
          const hasNewStreaming = !currentStreamingDate && streamingDateFromTMDB !== null

          // Check for CHANGES (existing dates that differ)
          const theatricalChanged = currentTheatricalDate && theatricalDateFromTMDB && currentTheatricalDate !== theatricalDateFromTMDB
          const streamingChanged = currentStreamingDate && streamingDateFromTMDB && currentStreamingDate !== streamingDateFromTMDB

          // Track changes for logging
          if (theatricalChanged) {
            console.log(`[DiscoverDatesService] Movie ${movieId} theatrical date changed: ${currentTheatricalDate} → ${theatricalDateFromTMDB}`)
            datesChanged++
          }
          if (streamingChanged) {
            console.log(`[DiscoverDatesService] Movie ${movieId} streaming date changed: ${currentStreamingDate} → ${streamingDateFromTMDB}`)
            datesChanged++
          }

          // Prepare records for database update
          const releaseDateRecords = []
          let shouldNotifyTheatrical = false
          let shouldNotifyStreaming = false

          // Handle THEATRICAL date (discovery or change)
          if (hasNewTheatrical && theatricalDateFromTMDB) {
            releaseDateRecords.push({
              movie_id: movieId,
              country: 'US',
              release_type: 3,
              release_date: theatricalDateFromTMDB,
              last_validated_at: new Date().toISOString()
            })
            shouldNotifyTheatrical = theatricalDateFromTMDB > today
            datesDiscovered++
          } else if (theatricalChanged && theatricalDateFromTMDB) {
            releaseDateRecords.push({
              movie_id: movieId,
              country: 'US',
              release_type: 3,
              release_date: theatricalDateFromTMDB,
              last_validated_at: new Date().toISOString()
            })
            // Only notify if date moved EARLIER and is still in future
            shouldNotifyTheatrical = theatricalDateFromTMDB < currentTheatricalDate! && theatricalDateFromTMDB > today
          } else if (currentTheatricalDate) {
            // Just update validation timestamp (date unchanged)
            releaseDateRecords.push({
              movie_id: movieId,
              country: 'US',
              release_type: 3,
              release_date: currentTheatricalDate,
              last_validated_at: new Date().toISOString()
            })
            datesValidated++
          }

          // Handle STREAMING date (discovery or change)
          if (hasNewStreaming && streamingDateFromTMDB) {
            releaseDateRecords.push({
              movie_id: movieId,
              country: 'US',
              release_type: 4,
              release_date: streamingDateFromTMDB,
              last_validated_at: new Date().toISOString()
            })
            shouldNotifyStreaming = streamingDateFromTMDB > today
            datesDiscovered++
          } else if (streamingChanged && streamingDateFromTMDB) {
            releaseDateRecords.push({
              movie_id: movieId,
              country: 'US',
              release_type: 4,
              release_date: streamingDateFromTMDB,
              last_validated_at: new Date().toISOString()
            })
            // Only notify if date moved EARLIER and is still in future
            shouldNotifyStreaming = streamingDateFromTMDB < currentStreamingDate! && streamingDateFromTMDB > today
          } else if (currentStreamingDate) {
            // Just update validation timestamp (date unchanged)
            releaseDateRecords.push({
              movie_id: movieId,
              country: 'US',
              release_type: 4,
              release_date: currentStreamingDate,
              last_validated_at: new Date().toISOString()
            })
            datesValidated++
          }

          // Update database
          if (releaseDateRecords.length > 0) {
            const { error: upsertError } = await supabase
              .from('release_dates')
              .upsert(releaseDateRecords, {
                onConflict: 'movie_id,country,release_type'
              })

            if (upsertError) {
              console.error(`[DiscoverDatesService] Failed to upsert release dates for movie ${movieId}:`, upsertError)
              errors.push({ movieId, error: upsertError.message })
            }
          }

          // Add to notification queue if needed
          if (shouldNotifyTheatrical || shouldNotifyStreaming) {
            updatedMovies.set(movieId, {
              movieId,
              title: movieDetails.title,
              posterPath: movieDetails.poster_path,
              theatricalDate: shouldNotifyTheatrical ? theatricalDateFromTMDB : null,
              streamingDate: shouldNotifyStreaming ? streamingDateFromTMDB : null
            })
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

      console.log(`[DiscoverDatesService] Processed ${moviesProcessed} movies: ${datesDiscovered} discovered, ${datesValidated} validated, ${datesChanged} changed`)

      if (updatedMovies.size === 0) {
        return {
          success: true,
          moviesProcessed,
          datesDiscovered,
          datesValidated,
          datesChanged,
          emailsSent: 0,
          errors
        }
      }

      // Step 6: Check for existing notifications to prevent duplicates
      const userIds = [...new Set(allFollowsToProcess.map(f => f.user_id))]
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

      for (const follow of allFollowsToProcess) {
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

      console.log(`[DiscoverDatesService] Complete! Sent ${emailsSent} emails, discovered ${datesDiscovered} dates, validated ${datesValidated} dates, changed ${datesChanged} dates`)

      return {
        success: true,
        moviesProcessed,
        datesDiscovered,
        datesValidated,
        datesChanged,
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
