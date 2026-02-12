# Movie Tracker V2 - TODO

## Pending Tasks

### Email Improvements
- [ ] **Add release dates to email notifications**
  - Currently emails say "Released Today" but don't show the actual date
  - This causes confusion with UTC timezone (cron uses UTC, not PST)
  - **Proposed solution**: Add date inline with release type (e.g., "In Theaters • Dec 29")
  - **Files to modify**:
    - `src/lib/services/email-templates.ts` - Update `buildSingleReleaseEmail` and `buildBatchReleaseEmail`
    - Pass release date to templates (already available as `movie.releaseDate`)
  - **Options considered**:
    - Option 1: "Released December 29"
    - Option 2: "Released December 29, 2024" as subtext
    - Option 3: "In Theaters • Dec 29" (preferred - cleanest)

---

## Completed Tasks
- [x] Fix healthcheck.io pings by awaiting fetch in serverless functions
- [x] Add healthcheck.io integration to cron jobs
- [x] Implement automated cron jobs (cache refresh, date discovery, daily releases)
