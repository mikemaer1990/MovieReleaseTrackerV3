'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/floating-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)

  const { signUp } = useAuthContext()

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const showEmailError = emailTouched && email.length > 0 && !isValidEmail(email)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, name)
      setSuccess(true) // Show success message
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
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Join Movie Release Tracker and never miss a release
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            // Success Message
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      Account Created!
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                      We&apos;ve sent a confirmation email to <strong>{email}</strong>.
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Please check your inbox and click the confirmation link to activate your account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
                  <span className="mr-2">💡</span>
                  Tip: Check your spam folder if you don&apos;t see it within a few minutes.
                </p>
              </div>

              <div className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Already confirmed your email?{' '}
                  <Link href="/auth/signin" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            // Signup Form
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-3 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <FloatingInput
                  id="name"
                  type="text"
                  label="Name"
                  placeholder="Alex Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="h-4 w-4" />}
                  autoFocus
                  required
                />

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
                    required
                  />
                  {showEmailError && (
                    <p className="text-xs text-red-600 dark:text-red-400 px-1">
                      Please enter a valid email address
                    </p>
                  )}
                </div>

                <div className="space-y-2">
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
                  label="Confirm password"
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
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
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