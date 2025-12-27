import { createSupabaseAdmin } from '@/lib/supabase'
import { emailService } from '@/lib/services/email-service'
import { Movie } from '@/types/movie'

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
    overview: string | null
    vote_average: number | null
    release_dates: Array<{
      country: string
      release_type: number
      release_date: string
    }>
  }
}

interface ReleaseNotification {
  userId: string
  email: string
  name: string | null
  theatrical: Movie[]
  streaming: Movie[]
}

/**
 * Daily Releases Cron Job
 *
 * Runs daily at 9:00 AM to notify users of movies released today.
 * Checks both theatrical and streaming releases based on user follow preferences.
 */
export class DailyReleasesService {
  /**
   * Execute the daily releases job
   */
  async execute(): Promise<{
    success: boolean
    releasesToday: number
    emailsSent: number
    errors: Array<{ email: string; error: string }>
    healthcheckPinged?: { attempted: boolean; success: boolean; url?: string; status?: number; error?: string }
  }> {
    const supabase = createSupabaseAdmin()
    const today = new Date().toISOString().split('T')[0] // '2025-10-05'
    const errors: Array<{ email: string; error: string }> = []

    try {
      console.log(`[DailyReleasesService] Checking releases for ${today}`)

      // Step 1: Get all follows with movie release dates
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
            overview,
            vote_average,
            release_dates (
              country,
              release_type,
              release_date
            )
          )
        `)

      if (followsError) throw followsError

      const follows = allFollows as unknown as Follow[]
      console.log(`[DailyReleasesService] Checking ${follows.length} follows`)

      // Step 2: Filter for today's US releases matching follow type
      const todaysReleases = follows.filter(follow => {
        const usReleaseDates = follow.movie.release_dates?.filter(
          rd => rd.country === 'US' && rd.release_date === today
        ) || []

        const hasTheatricalToday = usReleaseDates.some(rd => rd.release_type === 3)
        const hasStreamingToday = usReleaseDates.some(rd => rd.release_type === 4)

        // Match follow type to release type
        if (follow.follow_type === 'THEATRICAL' && hasTheatricalToday) return true
        if (follow.follow_type === 'STREAMING' && hasStreamingToday) return true
        if (follow.follow_type === 'BOTH' && (hasTheatricalToday || hasStreamingToday)) return true

        return false
      })

      console.log(`[DailyReleasesService] Found ${todaysReleases.length} releases matching user preferences`)

      if (todaysReleases.length === 0) {
        return {
          success: true,
          releasesToday: 0,
          emailsSent: 0,
          errors: []
        }
      }

      // Step 3: Check for existing notifications (prevent duplicates)
      const userIds = [...new Set(todaysReleases.map(f => f.user_id))]
      const movieIds = [...new Set(todaysReleases.map(f => f.movie_id))]

      const { data: sentNotifications } = await supabase
        .from('notifications')
        .select('user_id, movie_id, notification_type')
        .in('user_id', userIds)
        .in('movie_id', movieIds)
        .in('notification_type', ['THEATRICAL_RELEASE', 'STREAMING_RELEASE'])

      const notifiedSet = new Set(
        sentNotifications?.map(n => `${n.user_id}:${n.movie_id}:${n.notification_type}`) || []
      )

      // Step 4: Filter out already-notified releases
      const newReleases = todaysReleases.filter(release => {
        const usReleaseDates = release.movie.release_dates?.filter(
          rd => rd.country === 'US' && rd.release_date === today
        ) || []

        const isTheatrical = usReleaseDates.some(rd => rd.release_type === 3)
        const notificationType = isTheatrical ? 'THEATRICAL_RELEASE' : 'STREAMING_RELEASE'
        const key = `${release.user_id}:${release.movie_id}:${notificationType}`

        return !notifiedSet.has(key)
      })

      console.log(`[DailyReleasesService] ${newReleases.length} new releases to notify (${todaysReleases.length - newReleases.length} already notified)`)

      if (newReleases.length === 0) {
        return {
          success: true,
          releasesToday: todaysReleases.length,
          emailsSent: 0,
          errors: []
        }
      }

      // Step 5: Group by user email and separate theatrical vs streaming
      const notificationsByUser = new Map<string, ReleaseNotification>()

      for (const release of newReleases) {
        const usReleaseDates = release.movie.release_dates?.filter(
          rd => rd.country === 'US' && rd.release_date === today
        ) || []

        const isTheatrical = usReleaseDates.some(rd => rd.release_type === 3)
        const isStreaming = usReleaseDates.some(rd => rd.release_type === 4)

        const movie: Movie = {
          id: release.movie.id,
          title: release.movie.title,
          posterPath: release.movie.poster_path,
          overview: release.movie.overview,
          voteAverage: release.movie.vote_average,
          releaseDate: today,
          popularity: 0,
          genres: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const userKey = release.user.email
        if (!notificationsByUser.has(userKey)) {
          notificationsByUser.set(userKey, {
            userId: release.user_id,
            email: release.user.email,
            name: release.user.name,
            theatrical: [],
            streaming: []
          })
        }

        const userData = notificationsByUser.get(userKey)!

        if (isTheatrical && !userData.theatrical.some(m => m.id === movie.id)) {
          userData.theatrical.push(movie)
        } else if (isStreaming && !userData.streaming.some(m => m.id === movie.id)) {
          userData.streaming.push(movie)
        }
      }

      console.log(`[DailyReleasesService] Sending emails to ${notificationsByUser.size} users`)

      // Step 6: Send batched emails
      let emailsSent = 0
      const notificationRecords = []

      for (const [email, userData] of notificationsByUser) {
        try {
          const user = { email: userData.email, name: userData.name }
          const totalMovies = userData.theatrical.length + userData.streaming.length

          // Send single or batch email based on count
          if (totalMovies === 1) {
            const movie = userData.theatrical[0] || userData.streaming[0]
            const releaseType = userData.theatrical.length > 0 ? 'theatrical' : 'streaming'
            await emailService.sendReleaseEmail(user, movie, releaseType)
          } else {
            await emailService.sendBatchReleaseEmail(user, userData.theatrical, userData.streaming)
          }

          emailsSent++

          // Record notifications
          for (const movie of userData.theatrical) {
            notificationRecords.push({
              user_id: userData.userId,
              movie_id: movie.id,
              notification_type: 'THEATRICAL_RELEASE',
              email_status: 'SENT',
              metadata: {
                release_date: today,
                release_type: 'theatrical'
              }
            })
          }

          for (const movie of userData.streaming) {
            notificationRecords.push({
              user_id: userData.userId,
              movie_id: movie.id,
              notification_type: 'STREAMING_RELEASE',
              email_status: 'SENT',
              metadata: {
                release_date: today,
                release_type: 'streaming'
              }
            })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`[DailyReleasesService] Failed to send email to ${email}:`, errorMessage)
          errors.push({ email, error: errorMessage })
        }
      }

      // Step 7: Record notifications in database
      if (notificationRecords.length > 0) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notificationRecords)

        if (notificationError) {
          console.error('[DailyReleasesService] Failed to record notifications:', notificationError)
        }
      }

      console.log(`[DailyReleasesService] Complete! Sent ${emailsSent} emails for ${newReleases.length} releases`)

      // Ping Healthchecks.io on success
      const healthcheckResult = await this.pingHealthcheck(true)

      return {
        success: true,
        releasesToday: todaysReleases.length,
        emailsSent,
        errors,
        healthcheckPinged: healthcheckResult
      }
    } catch (error) {
      console.error('[DailyReleasesService] Fatal error:', error)

      // Ping Healthchecks.io with failure
      await this.pingHealthcheck(false)

      throw error
    }
  }

  /**
   * Ping Healthchecks.io monitoring service
   * @param success - true for success ping, false for failure ping
   * @returns Object with ping status details
   */
  private async pingHealthcheck(success: boolean): Promise<{ attempted: boolean; success: boolean; url?: string; status?: number; error?: string }> {
    if (!process.env.HEALTHCHECK_DAILY_RELEASES_URL) {
      return { attempted: false, success: false, error: 'HEALTHCHECK_DAILY_RELEASES_URL not configured' }
    }

    try {
      const url = success
        ? process.env.HEALTHCHECK_DAILY_RELEASES_URL
        : `${process.env.HEALTHCHECK_DAILY_RELEASES_URL}/fail`

      const response = await fetch(url)
      console.log(`[DailyReleasesService] Healthchecks.io ping sent (${success ? 'success' : 'failure'}): ${response.status}`)

      return {
        attempted: true,
        success: response.ok,
        url: url,
        status: response.status
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[DailyReleasesService] Healthchecks.io ping failed:', errorMessage)
      return {
        attempted: true,
        success: false,
        error: errorMessage
      }
    }
  }
}

// Export singleton
export const dailyReleasesService = new DailyReleasesService()
