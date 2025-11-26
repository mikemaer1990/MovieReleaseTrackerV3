import { randomBytes } from 'crypto'
import { createSupabaseAdmin } from '@/lib/supabase'

export class PasswordResetService {
  /**
   * Generate a secure reset token and store it in the database
   * Deletes any existing unused tokens for the user (on-demand cleanup)
   */
  static async generateResetToken(userId: string): Promise<string> {
    const supabase = createSupabaseAdmin()

    // Delete old unused tokens for this user (on-demand cleanup)
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', userId)
      .is('used_at', null)

    // Generate cryptographically secure token (256-bit entropy)
    const token = randomBytes(32).toString('hex')

    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    // Store token in database
    const { error } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt,
      })

    if (error) {
      console.error('[Password Reset Service] Error creating token:', error)
      throw new Error('Failed to create reset token')
    }

    return token
  }

  /**
   * Validate a reset token
   * Returns userId if valid, null if invalid/expired/used
   */
  static async validateToken(token: string): Promise<string | null> {
    const supabase = createSupabaseAdmin()

    const { data: resetToken, error } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !resetToken) {
      return null // Token doesn't exist
    }

    // Check if token has expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return null // Token expired
    }

    // Check if token has already been used
    if (resetToken.used_at !== null) {
      return null // Token already used
    }

    return resetToken.user_id
  }

  /**
   * Mark a token as used
   * Prevents token reuse
   */
  static async markTokenAsUsed(token: string): Promise<void> {
    const supabase = createSupabaseAdmin()

    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)
  }

  /**
   * Check if user has exceeded rate limit
   * Returns true if user can request reset, false if rate limit exceeded
   */
  static async checkRateLimit(userId: string): Promise<boolean> {
    const supabase = createSupabaseAdmin()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Count tokens created in the last hour for this user
    const { count, error } = await supabase
      .from('password_reset_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo)

    if (error) {
      console.error('[Password Reset Service] Error checking rate limit:', error)
      return true // Allow on error to not block users
    }

    // Allow up to 5 requests per hour
    return (count ?? 0) < 5
  }
}
