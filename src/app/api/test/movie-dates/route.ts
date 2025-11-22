import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * Test endpoint to check movie release dates in database
 *
 * SECURITY:
 * - Only works in development mode (NODE_ENV !== 'production')
 * - Protected by CRON_SECRET authorization header
 *
 * Usage: GET /api/test/movie-dates?movieId=12345
 * Headers: Authorization: Bearer YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Test endpoints are disabled in production' },
      { status: 403 }
    )
  }

  // Check authorization
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  const { searchParams } = new URL(request.url)
  const movieId = searchParams.get('movieId')

  if (!movieId) {
    return NextResponse.json({ error: 'movieId required' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  // Get movie with release_dates
  const { data: movie, error } = await supabase
    .from('movies')
    .select(`
      id,
      title,
      release_date,
      release_dates (
        id,
        movie_id,
        country,
        release_type,
        release_date,
        certification,
        created_at
      )
    `)
    .eq('id', movieId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    movie,
    usReleaseDates: movie?.release_dates?.filter((rd: any) => rd.country === 'US'),
    today: new Date().toISOString().split('T')[0]
  }, { status: 200 })
}
