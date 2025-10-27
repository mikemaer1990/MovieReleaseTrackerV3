# Cache Refresh Cron Job Documentation

## Overview
Automated daily cache refresh for upcoming movies to ensure fresh data without requiring users to wait for cache rebuilds.

## Architecture

### Endpoint
- **Path:** `/api/cron/refresh-cache`
- **Method:** GET
- **Authentication:** Bearer token using `CRON_SECRET`
- **Schedule:** Daily at 3:00 AM UTC

### What It Does
1. Rebuilds the entire upcoming movies cache
2. Fetches movies from 8 languages (en, ko, ja, fr, de, es, it, pt)
3. Enriches with runtime and release date data
4. Stores in Redis with 24-hour TTL
5. Logs detailed statistics
6. Sends email notification if refresh fails

### Performance
- **Average Duration:** 80-90 seconds
- **Movies Processed:** ~1,169 total fetched, ~698 after filtering
- **API Calls:** ~102 pages to TMDB API

## Configuration

### Environment Variables Required

```bash
# .env.local and Vercel Environment Variables
CRON_SECRET=your_cron_secret_here
ADMIN_EMAIL=your_email@domain.com
BREVO_API_KEY=your_brevo_api_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
TMDB_API_KEY=your_tmdb_api_key
```

### Vercel Configuration

In `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-cache",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Schedule Format:** Cron expression (minute hour day month weekday)
- `0 3 * * *` = Every day at 3:00 AM UTC

## Testing

### Local Testing

1. **Clear the cache first (optional):**
```bash
curl -X POST http://localhost:3010/api/test/clear-cache
```

2. **Trigger the cron job:**
```bash
curl -X GET "http://localhost:3010/api/cron/refresh-cache" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

3. **Expected Response (success):**
```json
{
  "success": true,
  "stats": {
    "totalFetched": 1169,
    "totalPages": 102,
    "duplicatesRemoved": 600,
    "moviesWithin6Months": 909,
    "foundMoviesBeyondCutoff": false
  },
  "duration": "81333ms",
  "message": "Cache refreshed successfully"
}
```

4. **Check server logs:**
```
[Cron] Starting refresh-cache job...
Building cache for date range: 2025-10-27 to 2026-04-27
...
[Cron] refresh-cache completed successfully in 81333ms
```

### Production Testing

#### Option 1: Vercel Dashboard
1. Go to your Vercel project
2. Navigate to **Settings** → **Cron Jobs**
3. Find `/api/cron/refresh-cache`
4. Click **"Trigger"** button to run manually

#### Option 2: API Call
```bash
curl -X GET "https://your-domain.com/api/cron/refresh-cache" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### Option 3: Wait for Scheduled Run
- Runs automatically at 3:00 AM UTC daily
- Check logs in Vercel dashboard under **Functions** → **Logs**

## Monitoring

### Success Indicators
1. **Response:** `success: true`
2. **Stats:** Shows reasonable number of movies processed
3. **Duration:** ~80-90 seconds (normal)
4. **Logs:** "refresh-cache completed successfully"

### Failure Indicators
1. **Response:** `success: false` with error message
2. **Email:** Admin receives failure notification
3. **Status Code:** 500
4. **Logs:** Error messages in console

### Email Notifications

#### When Sent
- Cache refresh fails completely
- Build process throws an exception
- Invalid data returned from TMDB

#### Email Format
- **Subject:** "⚠️ Cache Refresh Failed"
- **Contains:**
  - Error message
  - Stats (if available)
  - Timestamp
  - Job information

#### Email Configuration
The notification is sent to the email specified in `ADMIN_EMAIL` environment variable using the Brevo API.

## Troubleshooting

### Issue: "Unauthorized" Error
**Solution:** Verify `CRON_SECRET` matches in:
- `.env.local` (local)
- Vercel environment variables (production)
- Request header

### Issue: Cache Refresh Takes Too Long
**Normal Duration:** 80-150 seconds
**If longer:**
- Check TMDB API rate limits
- Verify Redis connection
- Check network latency

### Issue: Email Not Sent on Failure
**Check:**
1. `BREVO_API_KEY` is set correctly
2. `ADMIN_EMAIL` is valid
3. Brevo account is active
4. Check Brevo dashboard for delivery status

### Issue: Cache Not Updating
**Verify:**
1. Cron job is actually running (check Vercel logs)
2. Redis connection is working (`/api/test-redis`)
3. TMDB API key is valid
4. No rate limiting from TMDB

## User Experience Benefits

### Before Cron Job
1. User visits `/search` or `/upcoming`
2. If cache expired → wait 80-150 seconds
3. Page appears to hang or timeout
4. User must refresh manually

### After Cron Job
1. Cache refreshed daily at 3 AM UTC (low traffic)
2. User visits page → instant load
3. If cache somehow expired → automatic retry polling
4. Seamless user experience

## Cache Strategy

### Three-Layer Approach

1. **Daily Cron Refresh (Primary)**
   - Keeps cache fresh proactively
   - Runs during low-traffic hours
   - 99% of users get instant data

2. **Automatic Retry Polling (Backup)**
   - If cache expires unexpectedly
   - Frontend polls every 3 seconds
   - Populates automatically when ready

3. **Manual Rebuild (Emergency)**
   - Admin can trigger via API
   - Used for testing or immediate refresh
   - Endpoint: `POST /api/movies/upcoming`

## Maintenance

### Regular Tasks
- **Weekly:** Check Vercel cron logs for failures
- **Monthly:** Review cache hit rates
- **Quarterly:** Optimize cache duration if needed

### Updating Schedule
To change the refresh frequency, update `vercel.json`:

```json
"schedule": "0 3 * * *"     // Daily at 3 AM
"schedule": "0 */12 * * *"  // Every 12 hours
"schedule": "0 */6 * * *"   // Every 6 hours
```

**Note:** More frequent = more TMDB API calls

### Cost Considerations
- **Vercel Cron:** Free on Hobby plan (limited runs)
- **TMDB API:** Free (rate limited to 50 req/sec)
- **Upstash Redis:** Free tier available
- **Brevo Email:** Free tier (300 emails/day)

## Security

### Authentication
- Uses Bearer token authentication
- `CRON_SECRET` environment variable
- Must match exactly for access

### Best Practices
1. **Never commit** `CRON_SECRET` to git
2. **Rotate secrets** periodically
3. **Use different secrets** for dev/prod
4. **Monitor logs** for unauthorized attempts

### Rate Limiting
Currently no rate limiting on the endpoint itself (protected by auth).
Consider adding if needed:
- Max 1 call per hour per IP
- Vercel provides built-in DDoS protection

## Future Improvements

### Potential Enhancements
1. **Incremental Updates**
   - Only fetch movies changed since last refresh
   - Reduces API calls and duration

2. **Smart Scheduling**
   - Adjust frequency based on time of year
   - More frequent during release-heavy months

3. **Cache Warming**
   - Pre-build cache on deployment
   - Zero downtime during deploys

4. **Monitoring Dashboard**
   - Visualize cache hit rates
   - Track refresh success/failure trends
   - Alert on anomalies

5. **Slack Integration**
   - Send notifications to Slack instead of/in addition to email
   - Better for team visibility

## Deployment Checklist

Before deploying to production:

- [ ] Set `CRON_SECRET` in Vercel environment variables
- [ ] Set `ADMIN_EMAIL` in Vercel environment variables
- [ ] Verify `BREVO_API_KEY` is set
- [ ] Verify `UPSTASH_REDIS_REST_URL` and `TOKEN` are set
- [ ] Verify `TMDB_API_KEY` is set
- [ ] `vercel.json` includes the cron configuration
- [ ] Test endpoint locally first
- [ ] Deploy to Vercel
- [ ] Manually trigger once to verify
- [ ] Monitor logs for the first scheduled run
- [ ] Confirm email notification works (trigger a failure test)

## Support

For issues or questions:
1. Check Vercel function logs
2. Check this documentation
3. Review TMDB API status
4. Check Upstash Redis dashboard
5. Contact: mike@moviereleasetracker.online
