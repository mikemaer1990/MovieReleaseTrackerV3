import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { PasswordResetService } from '@/lib/services/password-reset-service'
import { emailService } from '@/lib/services/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create Supabase admin client to look up user
    const supabase = createSupabaseAdmin()

    // Look up user by email in Supabase auth
    const { data: { users }, error: lookupError } = await supabase.auth.admin.listUsers()

    if (lookupError) {
      console.error('[Request Reset] Error looking up user:', lookupError)
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      })
    }

    const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      // User not found - still return success (security: don't reveal if email exists)
      console.log(`[Request Reset] No user found with email: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      })
    }

    // Check rate limit
    const canRequest = await PasswordResetService.checkRateLimit(user.id)
    if (!canRequest) {
      // Rate limit exceeded - still return success but don't send email (security)
      console.log(`[Request Reset] Rate limit exceeded for user: ${user.id}`)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      })
    }

    // Generate reset token
    const token = await PasswordResetService.generateResetToken(user.id)

    // Send email
    try {
      await emailService.sendPasswordResetEmail(
        {
          email: user.email!,
          name: user.user_metadata?.name || null
        },
        token
      )
      console.log(`[Request Reset] Password reset email sent to ${user.email}`)
    } catch (emailError) {
      console.error('[Request Reset] Failed to send email:', emailError)
      // Still return success (don't reveal email service status)
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.'
    })

  } catch (error) {
    console.error('[Request Reset] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}
