import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * Fix endpoint to delete incorrect streaming release date for Wicked: For Good
 *
 * This deletes the Type 4 (Digital/Streaming) release date of Nov 17, 2025
 * which was incorrectly added due to bad TMDB data and is now in the past.
 */
export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdmin()

  // Delete the incorrect Type 4 release date for Wicked: For Good
  const { data, error } = await supabase
    .from('release_dates')
    .delete()
    .eq('movie_id', 967941)
    .eq('release_type', 4)
    .eq('release_date', '2025-11-17')
    .select()

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Deleted incorrect Type 4 (streaming) release date for Wicked: For Good',
    deleted: data
  })
}
