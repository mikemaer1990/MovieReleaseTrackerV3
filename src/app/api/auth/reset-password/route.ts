import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { PasswordResetService } from '@/lib/services/password-reset-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    // Validate inputs
    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength (server-side validation)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const passwordChecks = {
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    }

    if (!passwordChecks.uppercase || !passwordChecks.lowercase ||
        !passwordChecks.number || !passwordChecks.special) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must contain uppercase, lowercase, number, and special characters'
        },
        { status: 400 }
      )
    }

    // Validate token
    const userId = await PasswordResetService.validateToken(token)

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // Create Supabase admin client
    const supabase = createSupabaseAdmin()

    // Update password in Supabase auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('[Reset Password] Error updating password:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Mark token as used
    await PasswordResetService.markTokenAsUsed(token)

    console.log(`[Reset Password] Password successfully reset for user: ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('[Reset Password] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
