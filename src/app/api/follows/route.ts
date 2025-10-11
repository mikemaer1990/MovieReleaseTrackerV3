import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { tmdbService } from '@/lib/tmdb'
import { MovieService } from '@/lib/services/movie-service'

// POST /api/follows - Follow a movie
export async function POST(request: NextRequest) {
  try {
    const { movieId, followType } = await request.json()

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create separate clients - one for auth verification, one for database operations
    const authClient = createSupabaseAdmin()
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user with auth client
    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    if (!movieId || !followType) {
      return NextResponse.json(
        { error: 'movieId and followType are required' },
        { status: 400 }
      )
    }

    if (!['THEATRICAL', 'STREAMING', 'BOTH'].includes(followType)) {
      return NextResponse.json(
        { error: 'Invalid follow type' },
        { status: 400 }
      )
    }

    // Check if movie exists in our database, if not fetch and store it
    const movieExists = await MovieService.movieExists(movieId)
    
    if (!movieExists) {
      // Fetch movie details from TMDB
      const movieDetails = await tmdbService.getMovieDetails(movieId)
      const releaseDates = tmdbService.getUnifiedReleaseDates(movieDetails.release_dates)
      
      // Store movie in database
      await MovieService.storeMovie(movieDetails, releaseDates)
    }

    // Create a fresh admin client for database operations (bypasses RLS)
    const dbClient = createSupabaseAdmin()
    
    // Check if already following this movie with this type
    const { data: existingFollow } = await dbClient
      .from('follows')
      .select()
      .eq('user_id', user.id)
      .eq('movie_id', movieId)
      .eq('follow_type', followType)
      .single()

    if (existingFollow) {
      // Already following, return the existing follow
      return NextResponse.json({
        success: true,
        follow: existingFollow,
        message: 'Already following this movie'
      })
    }

    // Follow the movie using direct database access
    const { data: follow, error: followError } = await dbClient
      .from('follows')
      .insert({
        user_id: user.id,
        movie_id: movieId,
        follow_type: followType,
      })
      .select()
      .single()

    if (followError) {
      // Handle duplicate key error gracefully
      if (followError.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'Already following this movie'
        })
      }
      throw new Error(`Failed to follow movie: ${followError.message}`)
    }

    return NextResponse.json({
      success: true,
      follow,
    })
  } catch (error) {
    console.error('Follow movie error:', error)
    return NextResponse.json(
      { error: 'Failed to follow movie' },
      { status: 500 }
    )
  }
}

// GET /api/follows - Get user's follows
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create separate clients - one for auth verification, one for database operations
    const authClient = createSupabaseAdmin()
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user with auth client
    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Create a fresh admin client for database operations (bypasses RLS)
    const dbClient = createSupabaseAdmin()
    
    // Get user follows using direct database access
    const { data: follows, error: followsError } = await dbClient
      .from('follows')
      .select(`
        *,
        movies (
          *,
          release_dates (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (followsError) {
      throw new Error(`Failed to get user follows: ${followsError.message}`)
    }

    return NextResponse.json({
      follows,
    })
  } catch (error) {
    console.error('Get follows error:', error)
    return NextResponse.json(
      { error: 'Failed to get follows' },
      { status: 500 }
    )
  }
}

// DELETE /api/follows - Unfollow a movie
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = parseInt(searchParams.get('movieId') || '')
    const followType = searchParams.get('followType') as 'THEATRICAL' | 'STREAMING' | 'BOTH' | null

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create separate clients - one for auth verification, one for database operations
    const authClient = createSupabaseAdmin()
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user with auth client
    const { data: { user }, error: userError } = await authClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    if (!movieId) {
      return NextResponse.json(
        { error: 'movieId is required' },
        { status: 400 }
      )
    }

    // Create a fresh admin client for database operations (bypasses RLS)
    const dbClient = createSupabaseAdmin()
    
    // Unfollow the movie using direct database access
    let query = dbClient
      .from('follows')
      .delete()
      .eq('user_id', user.id)
      .eq('movie_id', movieId)

    if (followType) {
      query = query.eq('follow_type', followType)
    }

    const { error: unfollowError } = await query

    if (unfollowError) {
      throw new Error(`Failed to unfollow movie: ${unfollowError.message}`)
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Unfollow movie error:', error)
    return NextResponse.json(
      { error: 'Failed to unfollow movie' },
      { status: 500 }
    )
  }
}