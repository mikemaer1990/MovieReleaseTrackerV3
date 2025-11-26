import { Movie } from '@/types/movie'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface User {
  email: string
  name: string | null
}

interface MovieWithDates {
  movie: Movie
  theatricalDate: string | null
  streamingDate: string | null
}

/**
 * Base email layout wrapper
 */
function getBaseLayout(headerText: string, subheaderText: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Movie Release Tracker</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.6);">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(90deg, #f3d96b 0%, #d8b94b 50%, #f3d96b 100%); padding: 40px 32px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🎬</div>
              <h1 style="margin: 0; font-size: 28px; color: #0a0a0a; font-weight: 700;">${headerText}</h1>
              <p style="margin: 12px 0 0 0; font-size: 16px; color: #1a1a1a;">${subheaderText}</p>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 40px 32px; background-color: #1a1a1a;">
              ${bodyContent}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 32px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #a3a3a3;">
                Movie Release Tracker
              </p>
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                <a href="{{unsubscribe}}" style="color: #a3a3a3; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Helper to format date (YYYY-MM-DD -> Month DD, YYYY)
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

/**
 * Helper to get poster URL
 */
function getPosterUrl(posterPath: string | null, size: 'w342' | 'w500' = 'w500'): string {
  if (!posterPath) {
    return `${APP_URL}/placeholder-poster.png`
  }
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}

/**
 * Template 1: Single Date Discovered
 */
export function buildSingleDateDiscoveredEmail(
  user: User,
  movieWithDates: MovieWithDates
): string {
  const { movie, theatricalDate, streamingDate } = movieWithDates
  const releaseType = theatricalDate ? 'Theatrical' : 'Streaming'
  const releaseDate = formatDate((theatricalDate || streamingDate)!)
  const releaseTypeText = theatricalDate ? 'In Theaters' : 'Available for Streaming'

  const bodyContent = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f1f1f 0%, #2b2b2b 100%); border: 1px solid #333; border-radius: 12px;">
  <tr>
    <td style="padding: 32px; text-align: center;">

      <!-- Poster Image -->
      <img src="${getPosterUrl(movie.posterPath)}" alt="${movie.title}" width="200" height="300" style="border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.6); display: block; margin: 0 auto;" />

      <!-- Movie Title -->
      <h2 style="font-size: 24px; color: #f3d96b; margin: 24px 0 16px 0; font-weight: 600;">${movie.title}</h2>

      <!-- Release Date Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 400px; margin: 24px auto; background: linear-gradient(90deg, rgba(243,217,107,0.1), rgba(216,185,75,0.1)); border: 1px solid rgba(243,217,107,0.2); border-radius: 8px;">
        <tr>
          <td style="padding: 20px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #f3d96b; font-weight: 600;">${releaseDate}</p>
            <p style="margin: 0; font-size: 14px; color: #a3a3a3;">${releaseTypeText}</p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
        <tr>
          <td style="border-radius: 8px; background: linear-gradient(90deg, #f3d96b 0%, #d8b94b 50%, #f3d96b 100%);">
            <a href="${APP_URL}/movie/${movie.id}" style="display: inline-block; padding: 16px 32px; color: #0a0a0a; text-decoration: none; font-weight: 600; font-size: 16px;">View Movie Details</a>
          </td>
        </tr>
      </table>

      <p style="margin: 16px 0 0 0; font-size: 14px; color: #a3a3a3; line-height: 1.5;">
        We'll notify you again when this movie is released!
      </p>

    </td>
  </tr>
</table>`

  return getBaseLayout(
    'Release Date Added!',
    'We found a release date for your movie',
    bodyContent
  )
}

/**
 * Template 2: Batch Date Discovered
 */
export function buildBatchDateDiscoveredEmail(
  user: User,
  moviesWithDates: MovieWithDates[]
): string {
  const movieCards = moviesWithDates.map(({ movie, theatricalDate, streamingDate }) => {
    const theatricalHtml = theatricalDate ? `
        <div style="background: rgba(243,217,107,0.1); border-radius: 6px; padding: 12px; margin-bottom: 8px; display: inline-block;">
          <p style="margin: 0 0 2px 0; font-size: 16px; color: #f3d96b; font-weight: 600;">🎬 ${formatDate(theatricalDate)}</p>
          <p style="margin: 0; font-size: 12px; color: #a3a3a3;">In Theaters</p>
        </div>` : ''

    const streamingHtml = streamingDate ? `
        <div style="background: rgba(243,217,107,0.1); border-radius: 6px; padding: 12px; display: inline-block;">
          <p style="margin: 0 0 2px 0; font-size: 16px; color: #f3d96b; font-weight: 600;">📺 ${formatDate(streamingDate)}</p>
          <p style="margin: 0; font-size: 12px; color: #a3a3a3;">Streaming</p>
        </div>` : ''

    return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f1f1f, #2b2b2b); border-radius: 12px; margin-bottom: 24px; border: 1px solid #333;">
    <tr>
      <td width="140" style="padding: 20px; vertical-align: top;">
        <img src="${getPosterUrl(movie.posterPath, 'w342')}" alt="${movie.title}" width="120" height="180" style="border-radius: 8px; display: block;" />
      </td>
      <td style="padding: 20px; vertical-align: top;">
        <h3 style="margin: 0 0 12px 0; font-size: 20px; color: #f3d96b; font-weight: 600;">${movie.title}</h3>
        ${theatricalHtml}
        ${streamingHtml}
        <div style="margin-top: 16px;">
          <a href="${APP_URL}/movie/${movie.id}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(90deg, #f3d96b, #d8b94b); color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">View Details</a>
        </div>
      </td>
    </tr>
  </table>`
  }).join('')

  const bodyContent = `
<div>
  <p style="margin: 0 0 24px 0; font-size: 16px; color: #ededed; text-align: center;">
    We found release dates for <strong style="color: #f3d96b;">${moviesWithDates.length}</strong> ${moviesWithDates.length === 1 ? 'movie' : 'movies'} you're following
  </p>
  ${movieCards}
</div>`

  return getBaseLayout(
    'Release Dates Added!',
    `${moviesWithDates.length} ${moviesWithDates.length === 1 ? 'movie' : 'movies'} now ${moviesWithDates.length === 1 ? 'has' : 'have'} release dates`,
    bodyContent
  )
}

/**
 * Template 3: Single Release Notification
 */
export function buildSingleReleaseEmail(
  user: User,
  movie: Movie,
  releaseType: 'theatrical' | 'streaming'
): string {
  const releaseTypeIcon = releaseType === 'theatrical' ? '🎬' : '📺'
  const releaseTypeText = releaseType === 'theatrical' ? 'Now in Theaters' : 'Available for Streaming'
  const ctaText = releaseType === 'theatrical' ? 'Find Showtimes' : 'Stream Now'

  const ratingHtml = movie.voteAverage && movie.voteAverage > 0 ? `
      <div style="margin-bottom: 16px;">
        <span style="font-size: 18px; color: #fbbf24;">★</span>
        <span style="font-size: 16px; color: #ededed; font-weight: 600;">${movie.voteAverage.toFixed(1)}/10</span>
      </div>` : ''

  const bodyContent = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f1f1f 0%, #2b2b2b 100%); border: 1px solid #333; border-radius: 12px;">
  <tr>
    <td style="padding: 32px; text-align: center;">

      <!-- "Released Today" Badge -->
      <div style="display: inline-block; background: linear-gradient(90deg, #f3d96b, #d8b94b); color: #0a0a0a; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 14px; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px;">
        Available Now!
      </div>

      <!-- Poster Image -->
      <img src="${getPosterUrl(movie.posterPath)}" alt="${movie.title}" width="200" height="300" style="border-radius: 8px; box-shadow: 0 0 20px rgba(243,217,107,0.3), 0 6px 20px rgba(0,0,0,0.6); display: block; margin: 0 auto;" />

      <!-- Movie Title -->
      <h2 style="font-size: 28px; color: #f3d96b; margin: 24px 0 8px 0; font-weight: 700;">${movie.title}</h2>

      ${ratingHtml}

      <!-- Release Type Badge -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 400px; margin: 24px auto; background: linear-gradient(90deg, rgba(243,217,107,0.15), rgba(216,185,75,0.15)); border: 2px solid #f3d96b; border-radius: 8px;">
        <tr>
          <td style="padding: 20px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 22px; color: #f3d96b; font-weight: 700;">${releaseTypeIcon} ${releaseTypeText}</p>
            <p style="margin: 0; font-size: 14px; color: #a3a3a3;">Released Today</p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
        <tr>
          <td style="border-radius: 8px; background: linear-gradient(90deg, #f3d96b 0%, #d8b94b 50%, #f3d96b 100%); box-shadow: 0 4px 12px rgba(243,217,107,0.3);">
            <a href="${APP_URL}/movie/${movie.id}" style="display: inline-block; padding: 18px 40px; color: #0a0a0a; text-decoration: none; font-weight: 700; font-size: 18px;">${ctaText}</a>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>`

  return getBaseLayout(
    'Release Day!',
    'Your followed movie is now available',
    bodyContent
  )
}

/**
 * Template 4: Batch Release Notification
 */
export function buildBatchReleaseEmail(
  user: User,
  theatrical: Movie[],
  streaming: Movie[]
): string {
  const totalCount = theatrical.length + streaming.length

  const theatricalSection = theatrical.length > 0 ? `
  <h2 style="font-size: 22px; color: #f3d96b; margin: 0 0 20px 0; padding-bottom: 12px; border-bottom: 2px solid #333; font-weight: 700;">
    🎬 Now in Theaters (${theatrical.length})
  </h2>
  ${theatrical.map(movie => {
    const ratingHtml = movie.voteAverage && movie.voteAverage > 0 ? `
        <div style="margin-bottom: 12px;">
          <span style="font-size: 16px; color: #fbbf24;">★</span>
          <span style="font-size: 14px; color: #ededed; font-weight: 600;">${movie.voteAverage.toFixed(1)}/10</span>
        </div>` : ''

    return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f1f1f, #2b2b2b); border-radius: 12px; margin-bottom: 20px; border: 1px solid #333;">
    <tr>
      <td width="140" style="padding: 20px; vertical-align: top;">
        <img src="${getPosterUrl(movie.posterPath, 'w342')}" alt="${movie.title}" width="120" height="180" style="border-radius: 8px; display: block;" />
      </td>
      <td style="padding: 20px; vertical-align: top;">
        <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #f3d96b; font-weight: 600;">${movie.title}</h3>
        ${ratingHtml}
        <div style="background: rgba(243,217,107,0.1); border-radius: 6px; padding: 12px; display: inline-block; margin-bottom: 12px;">
          <p style="margin: 0 0 2px 0; font-size: 14px; color: #f3d96b; font-weight: 600;">In Theaters Now</p>
        </div>
        <div>
          <a href="${APP_URL}/movie/${movie.id}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(90deg, #f3d96b, #d8b94b); color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Find Showtimes</a>
        </div>
      </td>
    </tr>
  </table>`
  }).join('')}` : ''

  const streamingSection = streaming.length > 0 ? `
  <h2 style="font-size: 22px; color: #f3d96b; margin: ${theatrical.length > 0 ? '32px' : '0'} 0 20px 0; padding-bottom: 12px; border-bottom: 2px solid #333; font-weight: 700;">
    📺 Available for Streaming (${streaming.length})
  </h2>
  ${streaming.map(movie => {
    const ratingHtml = movie.voteAverage && movie.voteAverage > 0 ? `
        <div style="margin-bottom: 12px;">
          <span style="font-size: 16px; color: #fbbf24;">★</span>
          <span style="font-size: 14px; color: #ededed; font-weight: 600;">${movie.voteAverage.toFixed(1)}/10</span>
        </div>` : ''

    return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f1f1f, #2b2b2b); border-radius: 12px; margin-bottom: 20px; border: 1px solid #333;">
    <tr>
      <td width="140" style="padding: 20px; vertical-align: top;">
        <img src="${getPosterUrl(movie.posterPath, 'w342')}" alt="${movie.title}" width="120" height="180" style="border-radius: 8px; display: block;" />
      </td>
      <td style="padding: 20px; vertical-align: top;">
        <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #f3d96b; font-weight: 600;">${movie.title}</h3>
        ${ratingHtml}
        <div style="background: rgba(243,217,107,0.1); border-radius: 6px; padding: 12px; display: inline-block; margin-bottom: 12px;">
          <p style="margin: 0 0 2px 0; font-size: 14px; color: #f3d96b; font-weight: 600;">Streaming Now</p>
        </div>
        <div>
          <a href="${APP_URL}/movie/${movie.id}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(90deg, #f3d96b, #d8b94b); color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Stream Now</a>
        </div>
      </td>
    </tr>
  </table>`
  }).join('')}` : ''

  const bodyContent = `
<div>
  <p style="margin: 0 0 32px 0; font-size: 18px; color: #ededed; text-align: center; line-height: 1.5;">
    <strong style="color: #f3d96b; font-size: 24px;">${totalCount}</strong> ${totalCount === 1 ? 'movie' : 'movies'} you're following ${totalCount === 1 ? 'is' : 'are'} available today!
  </p>
  ${theatricalSection}
  ${streamingSection}
</div>`

  return getBaseLayout(
    'Release Day!',
    `${totalCount} ${totalCount === 1 ? 'movie is' : 'movies are'} now available`,
    bodyContent
  )
}

/**
 * Template: Password Reset Email
 */
export function buildPasswordResetEmail(
  user: User,
  resetUrl: string
): string {
  const userName = user.name || user.email.split('@')[0]

  const bodyContent = `
<div style="color: #ededed;">
  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
    Hi ${userName},
  </p>
  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
    We received a request to reset your password for your Movie Release Tracker account.
  </p>
  <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6;">
    Click the button below to create a new password:
  </p>

  <!-- Reset Button -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding-bottom: 32px;">
        <a href="${resetUrl}" style="display: inline-block; padding: 16px 48px; background-color: #f3d96b; color: #0a0a0a; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 0 20px rgba(243, 217, 107, 0.4); transition: all 0.2s;">
          Reset Password
        </a>
      </td>
    </tr>
  </table>

  <div style="margin: 0 0 24px 0; padding: 20px; background-color: #262626; border-radius: 8px; border-left: 4px solid #f3d96b;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #f3d96b; font-weight: 600;">
      ⏰ This link expires in 1 hour
    </p>
    <p style="margin: 0; font-size: 14px; color: #a3a3a3; line-height: 1.6;">
      For security reasons, this password reset link will only be valid for 1 hour.
    </p>
  </div>

  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a3a3a3;">
    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
  </p>

  <!-- Alternative Link Section -->
  <div style="margin: 32px 0 0 0; padding: 20px; background-color: #0f0f0f; border-radius: 8px; border: 1px solid #262626;">
    <p style="margin: 0 0 12px 0; font-size: 13px; color: #a3a3a3;">
      Button not working? Copy and paste this link into your browser:
    </p>
    <p style="margin: 0; font-size: 12px; color: #f3d96b; word-break: break-all; font-family: 'Courier New', monospace;">
      ${resetUrl}
    </p>
  </div>
</div>`

  return getBaseLayout(
    'Reset Your Password',
    'Click the button below to create a new password',
    bodyContent
  )
}
