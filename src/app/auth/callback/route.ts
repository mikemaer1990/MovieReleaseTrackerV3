import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle error from Supabase
  if (error) {
    console.error('[Auth Callback] Error from Supabase:', error, error_description)
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    )
  }

  // Exchange code for session
  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('[Auth Callback] Error exchanging code:', exchangeError)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        )
      }

      // Successfully authenticated - redirect to dashboard
      console.log('[Auth Callback] Successfully authenticated user')
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    } catch (err) {
      console.error('[Auth Callback] Unexpected error:', err)
      return NextResponse.redirect(
        new URL('/auth/signin?error=Authentication failed', requestUrl.origin)
      )
    }
  }

  // No code provided - redirect to signin
  console.warn('[Auth Callback] No code provided')
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
}
