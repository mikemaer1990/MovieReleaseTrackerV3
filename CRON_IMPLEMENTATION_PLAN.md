# Movie Release Tracker - Cron Job Implementation Plan

## Overview
This document outlines the complete implementation for two daily cron jobs that manage release date discovery and user notifications for followed movies.

**Key Principles:**
- All email HTML uses inline styles (required for email clients)
- Tables for layout (email-safe, no flexbox/grid)
- Tested patterns from email frameworks
- No external CSS or JavaScript
- All images use absolute URLs

---

## Database Schema Review

### Current Tables (Relevant to Cron Jobs)

```prisma
User {
  id, email, name
  follows: Follow[]
  notifications: Notification[]
}

Movie {
  id (TMDB ID), title, posterPath, releaseDate, overview, genres, popularity, voteAverage
  releaseDates: ReleaseDate[]
  follows: Follow[]
}

ReleaseDate {
  id, movieId, country, releaseType, releaseDate, certification
  // releaseType values (from TMDB):
  // 1 = Premiere
  // 2 = Theatrical (limited)
  // 3 = Theatrical (wide) ← PRIMARY THEATRICAL
  // 4 = Digital ← PRIMARY STREAMING
  // 5 = Physical
  // 6 = TV
}

Follow {
  id, userId, movieId, followType, createdAt
  // followType: 'THEATRICAL' | 'STREAMING' | 'BOTH'
}

Notification {
  id, userId, movieId, notificationType, sentAt, emailStatus, metadata
  // notificationType: 'THEATRICAL_RELEASE' | 'STREAMING_RELEASE' | 'DATE_DISCOVERED'
  // emailStatus: 'SENT' | 'FAILED' | 'PENDING'
}
```

---

## Cron Job 1: Date Discovery (`/api/cron/discover-dates`)

**Schedule:** Daily at 3:00 AM (before release notifications)
**Purpose:** Find missing release dates for followed movies and notify users when dates are discovered

### Logic Flow

```
1. Query all follows where the movie is missing required release dates
2. Group by unique movie IDs (deduplicate TMDB API calls)
3. For each unique movie:
   a. Fetch fresh release_dates from TMDB API
   b. Parse for US theatrical (type 3) and streaming (type 4) dates
   c. Update ReleaseDate table
   d. Rate limit: 250ms delay between API calls
4. Identify which users to notify (based on their follow types)
5. Send batched "date discovered" emails (one email per user)
6. Record notifications in Notification table
```

### Database Queries

#### Query 1: Find Follows Needing Dates

```typescript
// Get all follows with their movie's current release dates
const supabaseAdmin = createSupabaseAdmin()

const { data: follows, error } = await supabaseAdmin
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

if (error) throw error

// Filter in JavaScript for missing dates
const followsNeedingDates = follows.filter(follow => {
  const usReleaseDates = follow.movie.release_dates?.filter(rd => rd.country === 'US') || []
  const hasTheatrical = usReleaseDates.some(rd => rd.release_type === 3)
  const hasStreaming = usReleaseDates.some(rd => rd.release_type === 4)

  if (follow.follow_type === 'THEATRICAL') return !hasTheatrical
  if (follow.follow_type === 'STREAMING') return !hasStreaming
  if (follow.follow_type === 'BOTH') return !hasTheatrical || !hasStreaming
  return false
})
```

#### Query 2: Update Release Dates

```typescript
// After fetching from TMDB, batch upsert new dates
const releaseDateRecords = []

if (unifiedDates.usTheatrical) {
  releaseDateRecords.push({
    movie_id: movieId,
    country: 'US',
    release_type: 3,
    release_date: unifiedDates.usTheatrical,
  })
}

if (unifiedDates.streaming) {
  releaseDateRecords.push({
    movie_id: movieId,
    country: 'US',
    release_type: 4,
    release_date: unifiedDates.streaming,
  })
}

if (releaseDateRecords.length > 0) {
  const { error } = await supabaseAdmin
    .from('release_dates')
    .upsert(releaseDateRecords, {
      onConflict: 'movie_id,country,release_type'
    })

  if (error) throw error
}
```

#### Query 3: Check Existing Notifications

```typescript
// Prevent duplicate "date discovered" emails
const userIds = [...new Set(updatedFollows.map(f => f.user_id))]
const movieIds = [...new Set(updatedFollows.map(f => f.movie_id))]

const { data: existingNotifications } = await supabaseAdmin
  .from('notifications')
  .select('user_id, movie_id')
  .eq('notification_type', 'DATE_DISCOVERED')
  .in('user_id', userIds)
  .in('movie_id', movieIds)

// Convert to Set for fast lookup: "userId:movieId"
const notifiedSet = new Set(
  existingNotifications?.map(n => `${n.user_id}:${n.movie_id}`) || []
)

// Filter out already-notified combinations
const toNotify = updatedFollows.filter(f =>
  !notifiedSet.has(`${f.user_id}:${f.movie_id}`)
)
```

#### Query 4: Record Notifications

```typescript
// After sending emails successfully
const notificationRecords = successfulEmails.map(item => ({
  user_id: item.userId,
  movie_id: item.movieId,
  notification_type: 'DATE_DISCOVERED',
  email_status: 'SENT',
  metadata: {
    theatrical_date: item.theatricalDate || null,
    streaming_date: item.streamingDate || null,
  }
}))

const { error } = await supabaseAdmin
  .from('notifications')
  .insert(notificationRecords)

if (error) console.error('Failed to record notifications:', error)
```

---

## Cron Job 2: Release Notifications (`/api/cron/daily-releases`)

**Schedule:** Daily at 9:00 AM
**Purpose:** Notify users when their followed movies are released today

### Logic Flow

```
1. Get today's date (YYYY-MM-DD)
2. Query follows where movie has a release date matching today
3. Filter by follow type (theatrical vs streaming)
4. Check if notification already sent (prevent duplicates)
5. Group by user email
6. Send batched "now available" emails
7. Record notifications
```

### Database Queries

#### Query 1: Find Today's Releases

```typescript
const today = new Date().toISOString().split('T')[0] // '2025-10-05'
const supabaseAdmin = createSupabaseAdmin()

// Get all follows with movie release dates
const { data: allFollows, error } = await supabaseAdmin
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

if (error) throw error

// Filter for today's US releases
const todaysReleases = allFollows.filter(follow => {
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
```

#### Query 2: Check Existing Notifications

```typescript
const userIds = [...new Set(todaysReleases.map(f => f.user_id))]
const movieIds = [...new Set(todaysReleases.map(f => f.movie_id))]

const { data: sentNotifications } = await supabaseAdmin
  .from('notifications')
  .select('user_id, movie_id, notification_type')
  .in('user_id', userIds)
  .in('movie_id', movieIds)
  .in('notification_type', ['THEATRICAL_RELEASE', 'STREAMING_RELEASE'])

// Create lookup set
const notifiedSet = new Set(
  sentNotifications?.map(n => `${n.user_id}:${n.movie_id}:${n.notification_type}`) || []
)

// Filter out already-notified releases
const newReleases = todaysReleases.filter(release => {
  const usReleaseDates = release.movie.release_dates?.filter(
    rd => rd.country === 'US' && rd.release_date === today
  ) || []

  const isTheatrical = usReleaseDates.some(rd => rd.release_type === 3)
  const notificationType = isTheatrical ? 'THEATRICAL_RELEASE' : 'STREAMING_RELEASE'
  const key = `${release.user_id}:${release.movie_id}:${notificationType}`

  return !notifiedSet.has(key)
})
```

#### Query 3: Record Notifications

```typescript
const notificationRecords = newReleases.map(release => {
  const usReleaseDates = release.movie.release_dates?.filter(
    rd => rd.country === 'US' && rd.release_date === today
  ) || []
  const isTheatrical = usReleaseDates.some(rd => rd.release_type === 3)

  return {
    user_id: release.user_id,
    movie_id: release.movie_id,
    notification_type: isTheatrical ? 'THEATRICAL_RELEASE' : 'STREAMING_RELEASE',
    email_status: 'SENT',
    metadata: {
      release_date: today,
      release_type: isTheatrical ? 'theatrical' : 'streaming'
    }
  }
})

const { error } = await supabaseAdmin
  .from('notifications')
  .insert(notificationRecords)

if (error) console.error('Failed to record notifications:', error)
```

---

## Email Templates (Email-Client Safe)

### Base Email Layout

All emails use this structure with inline styles:

```html
<!DOCTYPE html>
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
              <h1 style="margin: 0; font-size: 28px; color: #0a0a0a; font-weight: 700;">{{HEADER_TEXT}}</h1>
              <p style="margin: 12px 0 0 0; font-size: 16px; color: #1a1a1a;">{{SUBHEADER_TEXT}}</p>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 40px 32px; background-color: #1a1a1a;">
              {{BODY_CONTENT}}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 32px; text-align: center; background-color: #0a0a0a; border-top: 1px solid #262626;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #a3a3a3;">
                Movie Release Tracker
              </p>
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                <a href="{{APP_URL}}/settings/notifications" style="color: #f3d96b; text-decoration: none;">Manage Preferences</a> |
                <a href="{{APP_URL}}/unsubscribe?token={{UNSUBSCRIBE_TOKEN}}" style="color: #a3a3a3; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Template 1: Single Date Discovered

```html
<!-- Body Content -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f1f1f 0%, #2b2b2b 100%); border: 1px solid #333; border-radius: 12px;">
  <tr>
    <td style="padding: 32px; text-align: center;">

      <!-- Poster Image -->
      <img src="https://image.tmdb.org/t/p/w500{{POSTER_PATH}}" alt="{{MOVIE_TITLE}}" width="200" height="300" style="border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,0.6); display: block; margin: 0 auto;" />

      <!-- Movie Title -->
      <h2 style="font-size: 24px; color: #f3d96b; margin: 24px 0 16px 0; font-weight: 600;">{{MOVIE_TITLE}}</h2>

      <!-- Release Date Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 400px; margin: 24px auto; background: linear-gradient(90deg, rgba(243,217,107,0.1), rgba(216,185,75,0.1)); border: 1px solid rgba(243,217,107,0.2); border-radius: 8px;">
        <tr>
          <td style="padding: 20px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 20px; color: #f3d96b; font-weight: 600;">{{RELEASE_DATE}}</p>
            <p style="margin: 0; font-size: 14px; color: #a3a3a3;">{{RELEASE_TYPE_TEXT}}</p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
        <tr>
          <td style="border-radius: 8px; background: linear-gradient(90deg, #f3d96b 0%, #d8b94b 50%, #f3d96b 100%);">
            <a href="{{APP_URL}}/movie/{{TMDB_ID}}" style="display: inline-block; padding: 16px 32px; color: #0a0a0a; text-decoration: none; font-weight: 600; font-size: 16px;">View Movie Details</a>
          </td>
        </tr>
      </table>

      <p style="margin: 16px 0 0 0; font-size: 14px; color: #a3a3a3; line-height: 1.5;">
        We'll notify you again when this movie is released!
      </p>

    </td>
  </tr>
</table>
```

### Template 2: Batch Date Discovered

```html
<!-- Body Content -->
<div>
  <p style="margin: 0 0 24px 0; font-size: 16px; color: #ededed; text-align: center;">
    We found release dates for <strong style="color: #f3d96b;">{{COUNT}}</strong> movies you're following
  </p>

  {{#EACH_MOVIE}}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f1f1f, #2b2b2b); border-radius: 12px; margin-bottom: 24px; border: 1px solid #333;">
    <tr>
      <td width="140" style="padding: 20px; vertical-align: top;">
        <img src="https://image.tmdb.org/t/p/w342{{POSTER_PATH}}" alt="{{MOVIE_TITLE}}" width="120" height="180" style="border-radius: 8px; display: block;" />
      </td>
      <td style="padding: 20px; vertical-align: top;">
        <h3 style="margin: 0 0 12px 0; font-size: 20px; color: #f3d96b; font-weight: 600;">{{MOVIE_TITLE}}</h3>

        {{#IF_THEATRICAL_DATE}}
        <div style="background: rgba(243,217,107,0.1); border-radius: 6px; padding: 12px; margin-bottom: 8px; display: inline-block;">
          <p style="margin: 0 0 2px 0; font-size: 16px; color: #f3d96b; font-weight: 600;">🎬 {{THEATRICAL_DATE}}</p>
          <p style="margin: 0; font-size: 12px; color: #a3a3a3;">In Theaters</p>
        </div>
        {{/IF_THEATRICAL_DATE}}

        {{#IF_STREAMING_DATE}}
        <div style="background: rgba(243,217,107,0.1); border-radius: 6px; padding: 12px; display: inline-block;">
          <p style="margin: 0 0 2px 0; font-size: 16px; color: #f3d96b; font-weight: 600;">📺 {{STREAMING_DATE}}</p>
          <p style="margin: 0; font-size: 12px; color: #a3a3a3;">Streaming</p>
        </div>
        {{/IF_STREAMING_DATE}}

        <div style="margin-top: 16px;">
          <a href="{{APP_URL}}/movie/{{TMDB_ID}}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(90deg, #f3d96b, #d8b94b); color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">View Details</a>
        </div>
      </td>
    </tr>
  </table>
  {{/EACH_MOVIE}}
</div>
```

### Template 3: Single Release Notification

```html
<!-- Body Content -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f1f1f 0%, #2b2b2b 100%); border: 1px solid #333; border-radius: 12px;">
  <tr>
    <td style="padding: 32px; text-align: center;">

      <!-- "Released Today" Badge -->
      <div style="display: inline-block; background: linear-gradient(90deg, #f3d96b, #d8b94b); color: #0a0a0a; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 14px; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.5px;">
        Available Now!
      </div>

      <!-- Poster Image -->
      <img src="https://image.tmdb.org/t/p/w500{{POSTER_PATH}}" alt="{{MOVIE_TITLE}}" width="200" height="300" style="border-radius: 8px; box-shadow: 0 0 20px rgba(243,217,107,0.3), 0 6px 20px rgba(0,0,0,0.6); display: block; margin: 0 auto;" />

      <!-- Movie Title -->
      <h2 style="font-size: 28px; color: #f3d96b; margin: 24px 0 8px 0; font-weight: 700;">{{MOVIE_TITLE}}</h2>

      {{#IF_RATING}}
      <div style="margin-bottom: 16px;">
        <span style="font-size: 18px; color: #fbbf24;">★</span>
        <span style="font-size: 16px; color: #ededed; font-weight: 600;">{{RATING}}/10</span>
      </div>
      {{/IF_RATING}}

      <!-- Release Type Badge -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 400px; margin: 24px auto; background: linear-gradient(90deg, rgba(243,217,107,0.15), rgba(216,185,75,0.15)); border: 2px solid #f3d96b; border-radius: 8px;">
        <tr>
          <td style="padding: 20px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 22px; color: #f3d96b; font-weight: 700;">{{RELEASE_TYPE_ICON}} {{RELEASE_TYPE_TEXT}}</p>
            <p style="margin: 0; font-size: 14px; color: #a3a3a3;">Released Today</p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
        <tr>
          <td style="border-radius: 8px; background: linear-gradient(90deg, #f3d96b 0%, #d8b94b 50%, #f3d96b 100%); box-shadow: 0 4px 12px rgba(243,217,107,0.3);">
            <a href="{{APP_URL}}/movie/{{TMDB_ID}}" style="display: inline-block; padding: 18px 40px; color: #0a0a0a; text-decoration: none; font-weight: 700; font-size: 18px;">{{CTA_TEXT}}</a>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
```

### Template 4: Batch Release Notification

```html
<!-- Body Content -->
<div>
  <p style="margin: 0 0 32px 0; font-size: 18px; color: #ededed; text-align: center; line-height: 1.5;">
    <strong style="color: #f3d96b; font-size: 24px;">{{COUNT}}</strong> movies you're following are available today!
  </p>

  {{#IF_THEATRICAL}}
  <h2 style="font-size: 22px; color: #f3d96b; margin: 0 0 20px 0; padding-bottom: 12px; border-bottom: 2px solid #333; font-weight: 700;">
    🎬 Now in Theaters ({{THEATRICAL_COUNT}})
  </h2>

  {{#EACH_THEATRICAL}}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f1f1f, #2b2b2b); border-radius: 12px; margin-bottom: 20px; border: 1px solid #333;">
    <tr>
      <td width="140" style="padding: 20px; vertical-align: top;">
        <img src="https://image.tmdb.org/t/p/w342{{POSTER_PATH}}" alt="{{MOVIE_TITLE}}" width="120" height="180" style="border-radius: 8px; display: block;" />
      </td>
      <td style="padding: 20px; vertical-align: top;">
        <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #f3d96b; font-weight: 600;">{{MOVIE_TITLE}}</h3>

        {{#IF_RATING}}
        <div style="margin-bottom: 12px;">
          <span style="font-size: 16px; color: #fbbf24;">★</span>
          <span style="font-size: 14px; color: #ededed; font-weight: 600;">{{RATING}}/10</span>
        </div>
        {{/IF_RATING}}

        <div style="background: rgba(243,217,107,0.1); border-radius: 6px; padding: 12px; display: inline-block; margin-bottom: 12px;">
          <p style="margin: 0 0 2px 0; font-size: 14px; color: #f3d96b; font-weight: 600;">In Theaters Now</p>
          <p style="margin: 0; font-size: 12px; color: #a3a3a3;">{{RELEASE_DATE}}</p>
        </div>

        <div>
          <a href="{{APP_URL}}/movie/{{TMDB_ID}}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(90deg, #f3d96b, #d8b94b); color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Find Showtimes</a>
        </div>
      </td>
    </tr>
  </table>
  {{/EACH_THEATRICAL}}
  {{/IF_THEATRICAL}}

  {{#IF_STREAMING}}
  <h2 style="font-size: 22px; color: #f3d96b; margin: 32px 0 20px 0; padding-bottom: 12px; border-bottom: 2px solid #333; font-weight: 700;">
    📺 Available for Streaming ({{STREAMING_COUNT}})
  </h2>

  {{#EACH_STREAMING}}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1f1f1f, #2b2b2b); border-radius: 12px; margin-bottom: 20px; border: 1px solid #333;">
    <tr>
      <td width="140" style="padding: 20px; vertical-align: top;">
        <img src="https://image.tmdb.org/t/p/w342{{POSTER_PATH}}" alt="{{MOVIE_TITLE}}" width="120" height="180" style="border-radius: 8px; display: block;" />
      </td>
      <td style="padding: 20px; vertical-align: top;">
        <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #f3d96b; font-weight: 600;">{{MOVIE_TITLE}}</h3>

        {{#IF_RATING}}
        <div style="margin-bottom: 12px;">
          <span style="font-size: 16px; color: #fbbf24;">★</span>
          <span style="font-size: 14px; color: #ededed; font-weight: 600;">{{RATING}}/10</span>
        </div>
        {{/IF_RATING}}

        <div style="background: rgba(243,217,107,0.1); border-radius: 6px; padding: 12px; display: inline-block; margin-bottom: 12px;">
          <p style="margin: 0 0 2px 0; font-size: 14px; color: #f3d96b; font-weight: 600;">Streaming Now</p>
          <p style="margin: 0; font-size: 12px; color: #a3a3a3;">{{RELEASE_DATE}}</p>
        </div>

        <div>
          <a href="{{APP_URL}}/movie/{{TMDB_ID}}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(90deg, #f3d96b, #d8b94b); color: #0a0a0a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Stream Now</a>
        </div>
      </td>
    </tr>
  </table>
  {{/EACH_STREAMING}}
  {{/IF_STREAMING}}
</div>
```

---

## File Structure

```
src/
├── lib/
│   └── services/
│       ├── email-service.ts              # Brevo email sending
│       ├── email-templates.ts            # HTML template builders
│       └── cron/
│           ├── discover-dates-service.ts # Date discovery logic
│           └── daily-releases-service.ts # Release notification logic
└── app/
    └── api/
        └── cron/
            ├── discover-dates/
            │   └── route.ts              # Cron endpoint
            └── daily-releases/
                └── route.ts              # Cron endpoint
```

---

## Implementation Checklist

### Phase 1: Email Service Setup
- [ ] Install dependencies: `npm install @sendinblue/client`
- [ ] Create `src/lib/services/email-templates.ts`
- [ ] Create `src/lib/services/email-service.ts`
- [ ] Add `BREVO_API_KEY` to `.env.local`
- [ ] Test email sending manually with test data

### Phase 2: Date Discovery Service
- [ ] Create `src/lib/services/cron/discover-dates-service.ts`
- [ ] Implement database queries
- [ ] Implement TMDB fetching with rate limiting
- [ ] Implement email batching logic
- [ ] Create `src/app/api/cron/discover-dates/route.ts`
- [ ] Test locally with curl

### Phase 3: Release Notification Service
- [ ] Create `src/lib/services/cron/daily-releases-service.ts`
- [ ] Implement database queries
- [ ] Implement notification deduplication
- [ ] Implement email batching logic
- [ ] Create `src/app/api/cron/daily-releases/route.ts`
- [ ] Test locally with curl

### Phase 4: Testing & Deployment
- [ ] Create test follows in database
- [ ] Manually trigger cron jobs locally
- [ ] Verify emails render correctly in Gmail/Outlook/Apple Mail
- [ ] Set environment variables in Vercel
- [ ] Deploy to production
- [ ] Monitor first execution in Vercel logs

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# TMDB
TMDB_API_KEY=xxx

# Brevo (SendinBlue)
BREVO_API_KEY=xxx

# Cron Security
CRON_SECRET=random_secret_string_min_32_chars

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Security & Performance

### CRON_SECRET Authentication

```typescript
// In each cron route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Execute cron logic...
}
```

### Rate Limiting (TMDB API)

```typescript
const uniqueMovieIds = [...new Set(follows.map(f => f.movie_id))]

for (let i = 0; i < uniqueMovieIds.length; i++) {
  const movieId = uniqueMovieIds[i]
  const movieDetails = await tmdbService.getMovieDetails(movieId)

  // Process movie...

  // Rate limit: 250ms between requests (except last one)
  if (i < uniqueMovieIds.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 250))
  }
}
```

### Error Handling

```typescript
// Wrap email sends in try-catch to prevent one failure from breaking entire job
for (const [email, data] of emailsByUser) {
  try {
    await emailService.sendEmail(data)
    successCount++
  } catch (error) {
    console.error(`Email failed for ${email}:`, error)
    failedEmails.push({
      email,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

return {
  success: true,
  processed: totalCount,
  succeeded: successCount,
  failed: failedEmails.length,
  errors: failedEmails
}
```

---

## Email Client Testing Notes

**Tested HTML patterns used:**
- ✅ Table-based layouts (works in all email clients)
- ✅ Inline styles only (no external CSS)
- ✅ Absolute image URLs (TMDB CDN)
- ✅ Linear gradients (supported in modern clients, graceful fallback)
- ✅ Border-radius (widely supported, degrades gracefully)
- ✅ Max-width for responsive (works in Gmail, Outlook)

**NOT USED (email-unsafe):**
- ❌ Flexbox/Grid layouts
- ❌ External CSS files
- ❌ JavaScript
- ❌ Background images
- ❌ CSS animations
- ❌ Custom fonts (use system fonts)

**Test in these clients before production:**
- Gmail (web + mobile)
- Outlook (desktop + web)
- Apple Mail (iOS + macOS)
- Yahoo Mail
- Use Litmus or Email on Acid for comprehensive testing

---

## Next Steps

1. **Start with Phase 1** - Build email service and templates
2. **Test templates** - Send test emails to yourself in different clients
3. **Build Phase 2** - Date discovery cron job
4. **Build Phase 3** - Release notification cron job
5. **Deploy** - Set up in Vercel with proper environment variables

This plan uses only email-safe HTML patterns with inline styles, tested table layouts, and real TMDB image URLs. All templates will render correctly in major email clients.
