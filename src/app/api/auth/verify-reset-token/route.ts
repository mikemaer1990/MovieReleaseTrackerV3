import { NextRequest, NextResponse } from 'next/server'
import { PasswordResetService } from '@/lib/services/password-reset-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Validate token
    const userId = await PasswordResetService.validateToken(token)

    if (!userId) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired reset link'
      })
    }

    return NextResponse.json({
      valid: true
    })

  } catch (error) {
    console.error('[Verify Reset Token] Error:', error)
    return NextResponse.json(
      { valid: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}
