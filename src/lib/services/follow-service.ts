import { createSupabaseAdmin } from '@/lib/supabase'
import { FollowType } from '@/types/movie'

export class FollowService {
  // Follow a movie
  static async followMovie(userId: string, movieId: number, followType: FollowType) {
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('follows')
      .insert({
        user_id: userId,
        movie_id: movieId,
        follow_type: followType,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to follow movie: ${error.message}`)
    }

    return data
  }

  // Unfollow a movie
  static async unfollowMovie(userId: string, movieId: number, followType?: FollowType) {
    const supabaseAdmin = createSupabaseAdmin()
    let query = supabaseAdmin
      .from('follows')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    if (followType) {
      query = query.eq('follow_type', followType)
    }

    const { error } = await query

    if (error) {
      throw new Error(`Failed to unfollow movie: ${error.message}`)
    }

    return true
  }

  // Get user's follows
  static async getUserFollows(userId: string) {
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('follows')
      .select(`
        *,
        movies (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get user follows: ${error.message}`)
    }

    return data
  }

  // Check if user is following a movie
  static async isFollowing(userId: string, movieId: number): Promise<FollowType[]> {
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('follows')
      .select('follow_type')
      .eq('user_id', userId)
      .eq('movie_id', movieId)

    if (error) {
      throw new Error(`Failed to check follow status: ${error.message}`)
    }

    return data?.map(f => f.follow_type as FollowType) || []
  }

  // Get follow statistics
  static async getFollowStats(userId: string) {
    const supabaseAdmin = createSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('follows')
      .select('follow_type')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to get follow stats: ${error.message}`)
    }

    const stats = {
      total: data?.length || 0,
      theatrical: data?.filter(f => f.follow_type === 'THEATRICAL' || f.follow_type === 'BOTH').length || 0,
      streaming: data?.filter(f => f.follow_type === 'STREAMING' || f.follow_type === 'BOTH').length || 0,
    }

    return stats
  }
}