'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/floating-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KeyRound, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No reset token provided')
        setVerifying(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`)
        const data = await response.json()

        if (data.valid) {
          setTokenValid(true)
        } else {
          setError(data.error || 'Invalid or expired reset link')
        }
      } catch (err) {
        setError('Failed to verify reset link')
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }

    if (checks.length) strength += 20
    if (checks.uppercase) strength += 20
    if (checks.lowercase) strength += 20
    if (checks.number) strength += 20
    if (checks.special) strength += 20

    return { strength, checks }
  }

  const passwordStrength = calculatePasswordStrength(password)

  const getStrengthColor = (strength: number) => {
    if (strength <= 40) return 'bg-red-500'
    if (strength <= 60) return 'bg-orange-500'
    if (strength <= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = (strength: number) => {
    if (strength === 0) return ''
    if (strength <= 40) return 'Weak'
    if (strength <= 60) return 'Fair'
    if (strength <= 80) return 'Good'
    return 'Strong'
  }

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (success && countdown === 0) {
      router.push('/auth/signin')
    }
  }, [success, countdown, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // Check all password requirements
    if (passwordStrength.strength < 100) {
      setError('Password must meet all requirements')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to reset password')
        return
      }

      // Password reset successful
      setSuccess(true)

    } catch (err) {
      setError('An error occurred. Please try again.')
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
              <KeyRound className="h-10 w-10 text-primary drop-shadow-[0_0_8px_rgba(243,217,107,0.3)]" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create new password</CardTitle>
          <CardDescription>
            Choose a strong password to secure your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {verifying ? (
            // Verifying Token
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Verifying reset link...</p>
            </div>
          ) : !tokenValid ? (
            // Invalid Token Error
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Need to reset your password?{' '}
                  <Link href="/auth/forgot-password" className="text-primary hover:underline">
                    Request a new reset link
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground">
                  <Link href="/auth/signin" className="text-primary hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </div>
            </div>
          ) : success ? (
            // Success Message with Countdown
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      Password Reset Successful!
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                      Your password has been updated successfully.
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Redirecting to sign in in {countdown} second{countdown !== 1 ? 's' : ''}...
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full shadow-[0_0_15px_rgba(243,217,107,0.2)] hover:shadow-[0_0_15px_rgba(243,217,107,0.3)] transition-shadow"
              >
                Go to Sign In Now
              </Button>
            </div>
          ) : (
            // Password Reset Form
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-3 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <FloatingInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    label="New password"
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
                    autoFocus
                    required
                  />

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength.strength)}`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          />
                        </div>
                        {passwordStrength.strength > 0 && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {getStrengthText(passwordStrength.strength)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs space-y-1">
                        <p className={passwordStrength.checks.length ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                          {passwordStrength.checks.length ? '✓' : '○'} At least 8 characters
                        </p>
                        <div className="flex gap-4">
                          <p className={passwordStrength.checks.uppercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                            {passwordStrength.checks.uppercase ? '✓' : '○'} Uppercase
                          </p>
                          <p className={passwordStrength.checks.lowercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                            {passwordStrength.checks.lowercase ? '✓' : '○'} Lowercase
                          </p>
                          <p className={passwordStrength.checks.number ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                            {passwordStrength.checks.number ? '✓' : '○'} Number
                          </p>
                          <p className={passwordStrength.checks.special ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                            {passwordStrength.checks.special ? '✓' : '○'} Special
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <FloatingInput
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  label="Confirm new password"
                  placeholder=""
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer -m-2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  required
                />

                <Button
                  type="submit"
                  className="w-full shadow-[0_0_15px_rgba(243,217,107,0.2)] hover:shadow-[0_0_15px_rgba(243,217,107,0.3)] transition-shadow"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link href="/auth/signin" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="py-12 px-4 xl:min-h-[calc(100vh-10rem)] xl:flex xl:items-center xl:justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
