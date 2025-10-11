'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/floating-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [rememberMe, setRememberMe] = useState(true) // Default to true

  const { signIn } = useAuthContext()
  const router = useRouter()

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const showEmailError = emailTouched && email.length > 0 && !isValidEmail(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Store remember me preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('rememberMe', String(rememberMe))
      }

      await signIn(email, password)
      router.push('/') // Redirect to home after successful sign in
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-12 px-4 xl:min-h-[calc(100vh-10rem)] xl:flex xl:items-center xl:justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 rounded-full p-3">
              <Film className="h-10 w-10 text-primary drop-shadow-[0_0_8px_rgba(243,217,107,0.3)]" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your Movie Release Tracker account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <FloatingInput
                id="email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                leftIcon={<Mail className="h-4 w-4" />}
                autoFocus
                required
              />
              {showEmailError && (
                <p className="text-xs text-red-600 dark:text-red-400 px-1">
                  Please enter a valid email address
                </p>
              )}
            </div>

            <FloatingInput
              id="password"
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              rightAction={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer -m-2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              required
            />

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer select-none transition-colors"
              >
                Remember me for 30 days
              </label>
            </div>

            <Button
              type="submit"
              className="w-full shadow-[0_0_15px_rgba(243,217,107,0.2)] hover:shadow-[0_0_15px_rgba(243,217,107,0.3)] transition-shadow"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              <Link href="/auth/forgot-password" className="text-primary hover:underline">
                Forgot your password?
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}