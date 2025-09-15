import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { FollowService } from '@/lib/services/follow-service'

// GET /api/follows/[movieId] - Check if user is following a specific movie
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const resolvedParams = await params
    const movieId = parseInt(resolvedParams.movieId)

    if (isNaN(movieId)) {
      return NextResponse.json(
        { error: 'Invalid movie ID' },
        { status: 400 }
      )
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create supabase client with the user's token
    const supabaseAdmin = createSupabaseAdmin()
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const followTypes = await FollowService.isFollowing(user.id, movieId)

    return NextResponse.json({
      isFollowing: followTypes.length > 0,
      followTypes,
    })
  } catch (error) {
    console.error('Check follow status error:', error)
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    )
  }
}