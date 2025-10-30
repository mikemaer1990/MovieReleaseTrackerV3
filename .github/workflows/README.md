# GitHub Actions Workflows

## Cache Refresh Workflow

**File:** `cache-refresh.yml`

**Purpose:** Triggers the daily cache refresh for upcoming movies to keep data fresh and search page fast.

**Schedule:** Daily at 3:00 AM UTC

**Why GitHub Actions?**
- Vercel free tier limits cron jobs to 2
- GitHub Actions provides unlimited scheduled workflows for free
- Same functionality, just triggered externally instead of within Vercel

### Setup Instructions

1. **Add Secret to GitHub Repository:**
   - Go to your GitHub repository settings
   - Navigate to: Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CRON_SECRET`
   - Value: Same value as your `CRON_SECRET` environment variable in Vercel

2. **Verify Workflow:**
   - The workflow will run automatically daily at 3 AM UTC
   - You can also trigger it manually from the Actions tab
   - Check the Actions tab for run history and logs

### Manual Trigger

You can manually trigger the cache refresh:
1. Go to the Actions tab in GitHub
2. Select "Daily Cache Refresh" workflow
3. Click "Run workflow"

### Monitoring

- Check workflow runs in the Actions tab
- If the cache refresh fails, the workflow will show as failed
- Application logs will contain detailed error information
- Admin email notifications are sent on failure (configured in the API route)
