import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * Test endpoint to check movie release dates in database
 */
export async function GET(request: NextRequest) {
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
