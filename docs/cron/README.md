# Cron Jobs Documentation

This directory contains comprehensive documentation for all scheduled cron jobs in the Movie Release Tracker application.

## Overview

The application runs **3 automated cron jobs** daily to maintain fresh data and notify users:

| Job | Schedule | Purpose | Documentation |
|-----|----------|---------|---------------|
| **Cache Refresh** | 3:00 AM UTC | Rebuild upcoming movies cache | [cache-refresh.md](./cache-refresh.md) |
| **Date Discovery** | 11:00 AM UTC | Find missing release dates | [notifications.md](./notifications.md#date-discovery) |
| **Release Notifications** | 2:00 PM UTC | Notify users of releases | [notifications.md](./notifications.md#release-notifications) |

## Quick Links

### For Developers
- **Testing Locally:** [notifications.md - Testing Guide](./notifications.md#testing)
- **API Endpoints:** All cron jobs are at `/api/cron/*`
- **Security:** All endpoints require `CRON_SECRET` in Authorization header

### For Deployment
- **Vercel Setup:** [cache-refresh.md - Deployment](./cache-refresh.md#deployment-checklist)
- **Environment Variables:** See both docs for required env vars
- **Migration Guide:** [notifications.md - Migration](./notifications.md#migration-guide)

### For Troubleshooting
- **Cache Issues:** [cache-refresh.md - Troubleshooting](./cache-refresh.md#troubleshooting)
- **Email Not Sending:** [notifications.md - Email Issues](./notifications.md#email-client-testing-notes)
- **Vercel Logs:** Check Functions → Logs in Vercel dashboard

## Architecture

### Cache Refresh (`/api/cron/refresh-cache`)
**Purpose:** Keeps the upcoming movies cache fresh so users don't wait for cache builds.

**How it works:**
1. Fetches upcoming movies from TMDB (8 languages)
2. Enriches with runtime and release date data
3. Stores in Redis cache (24-hour TTL)
4. Sends admin email on failure

**Key Features:**
- Automatic retry polling on frontend
- Email notifications on failure
- Detailed statistics logging
- 80-90 second execution time

**Documentation:** [cache-refresh.md](./cache-refresh.md)

---

### Date Discovery (`/api/cron/discover-dates`)
**Purpose:** Automatically finds missing release dates for followed movies and notifies users.

**How it works:**
1. Queries all follows where movies lack release dates
2. Fetches fresh data from TMDB API
3. Updates database with US theatrical/streaming dates
4. Sends batched email notifications to users
5. Records notifications to prevent duplicates

**Key Features:**
- US-only release dates (type 3 theatrical, type 4 streaming)
- Batched emails (one per user, multiple movies)
- Duplicate prevention
- TMDB rate limiting (250ms between requests)

**Documentation:** [notifications.md](./notifications.md)

---

### Release Notifications (`/api/cron/daily-releases`)
**Purpose:** Notifies users when their followed movies are released today.

**How it works:**
1. Checks today's date against release_dates table
2. Matches user follow types (theatrical/streaming/both)
3. Sends batched "now available" emails
4. Records notifications to prevent duplicates

**Key Features:**
- Batched notifications (theatrical + streaming in one email)
- Follow type matching (only notify for user's preferences)
- Beautiful HTML email templates
- Duplicate prevention

**Documentation:** [notifications.md](./notifications.md)

---

## Testing Cron Jobs

### Local Testing

```bash
# Set your cron secret
CRON_SECRET="your-secret-from-env-file"

# Test cache refresh
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3010/api/cron/refresh-cache

# Test date discovery
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3010/api/cron/discover-dates

# Test release notifications
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3010/api/cron/daily-releases
```

### Production Testing

```bash
# Replace with your production URL
PROD_URL="https://your-domain.com"

curl -H "Authorization: Bearer $CRON_SECRET" \
  "$PROD_URL/api/cron/refresh-cache"
```

## Email Templates

The notification jobs use 4 email template types:

1. **Single Date Discovered** - One movie gets a release date
2. **Batch Date Discovered** - Multiple movies get dates (grouped)
3. **Single Release** - One movie released today
4. **Batch Release** - Multiple releases today (theatrical + streaming sections)

All templates use:
- ✅ Inline styles (email-safe)
- ✅ Table-based layouts
- ✅ TMDB CDN images
- ✅ Mobile-responsive design
- ✅ Dark theme with golden accents

See [notifications.md - Email Templates](./notifications.md#email-templates) for details.

## Monitoring

### Vercel Dashboard
1. Go to your project → **Functions** → **Logs**
2. Filter by function name (`/api/cron/*`)
3. Look for success messages and execution times

### Expected Log Messages

**Cache Refresh:**
```
[Cron] Starting refresh-cache job...
[Cron] refresh-cache completed successfully in 81333ms
```

**Date Discovery:**
```
[Cron] Starting discover-dates job...
[DiscoverDatesService] Found 12 follows needing dates
[EmailService] Sent date discovered email to user@example.com
[Cron] discover-dates completed in 2341ms
```

**Release Notifications:**
```
[Cron] Starting daily-releases job...
[DailyReleasesService] Found 5 releases today
[EmailService] Sent batch release email to user@example.com
[Cron] daily-releases completed in 1823ms
```

## Security

All cron endpoints require authentication:

```typescript
Authorization: Bearer YOUR_CRON_SECRET
```

- Secret stored in `CRON_SECRET` environment variable
- Must be 32+ characters
- Should be different for dev/prod
- Never commit to git

## Migration to Other Hosts

If moving away from Vercel:

1. **API endpoints work anywhere** (no changes needed)
2. **Only the scheduler changes** (vercel.json → new method)
3. **3 options available:**
   - External cron service (cron-job.org) ← Recommended
   - Linux cron (VPS/server)
   - Native platform crons (Render, Railway)

Full migration guide: [notifications.md - Migration](./notifications.md#migration-guide)

## Common Issues

### Cron Job Not Running
- ✅ Check Vercel cron jobs are enabled
- ✅ Verify environment variables are set
- ✅ Test endpoint manually with curl
- ✅ Check Vercel logs for errors

### Emails Not Sending
- ✅ Verify `BREVO_API_KEY` is set
- ✅ Check sender email is verified in Brevo
- ✅ Look for email errors in Vercel logs
- ✅ Check Brevo dashboard for delivery status

### Cache Not Updating
- ✅ Verify Redis connection (`/api/test-redis`)
- ✅ Check TMDB API key is valid
- ✅ Look for rate limiting errors
- ✅ Test manual cache refresh

## Support

For detailed troubleshooting and testing procedures, see the individual documentation files:

- [cache-refresh.md](./cache-refresh.md) - Cache refresh job
- [notifications.md](./notifications.md) - Date discovery & release notifications

## File Structure

```
docs/cron/
├── README.md           # This file - overview of all cron jobs
├── cache-refresh.md    # Cache refresh job documentation
└── notifications.md    # Date discovery & release notification jobs
```
