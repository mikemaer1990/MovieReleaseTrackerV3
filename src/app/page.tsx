'use client'

import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, Search, Calendar, Bell, UserPlus, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user, isAuthenticated, loading } = useAuthContext()

  // Show nothing while checking authentication to prevent flash
  if (loading) {
    return null
  }

  if (isAuthenticated) {
    return (
      <div className="space-y-8 sm:space-y-12 xl:min-h-[calc(100vh-10rem)] xl:flex xl:flex-col xl:justify-center">
        <div className="text-center space-y-3 sm:space-y-6">
          <div className="flex justify-center">
            <Film className="h-10 w-10 sm:h-16 sm:w-16 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight px-4 bg-gradient-to-r from-primary via-amber-300 to-primary bg-[length:200%_auto] animate-[gradient_6s_linear_infinite] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(243,217,107,0.3)]">
            Welcome back, {user?.name || user?.email}!
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground/90 max-w-2xl mx-auto px-4 leading-relaxed">
            Ready to discover your next favorite movie?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Search Movies */}
          <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-0 md:space-y-3 p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex-shrink-0 bg-primary/10 rounded-full p-3">
              <Search className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <div className="flex-1 md:flex-none">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Search Movies</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Find new movies to follow and get notified when they're released
              </p>
              <Button asChild className="w-full shadow-[0_0_15px_rgba(243,217,107,0.2)] hover:shadow-[0_0_15px_rgba(243,217,107,0.3)] transition-shadow">
                <Link href="/search">Start Searching</Link>
              </Button>
            </div>
          </div>

          {/* My Movies */}
          <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-0 md:space-y-3 p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex-shrink-0 bg-primary/10 rounded-full p-3">
              <Film className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <div className="flex-1 md:flex-none">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">My Movies</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Manage your followed movies and notification preferences
              </p>
              <Button asChild variant="outline" className="w-full border-2 border-primary/40 hover:border-primary/60 hover:border-[2.5px] hover:bg-accent/50 transition-all">
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </div>

          {/* Upcoming Releases */}
          <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-0 md:space-y-3 p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
            <div className="flex-shrink-0 bg-primary/10 rounded-full p-3">
              <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <div className="flex-1 md:flex-none">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Upcoming Releases</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                See what movies are releasing soon
              </p>
              <Button asChild variant="outline" className="w-full border-2 border-primary/40 hover:border-primary/60 hover:border-[2.5px] hover:bg-accent/50 transition-all">
                <Link href="/upcoming">Browse Releases</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 sm:space-y-12 xl:min-h-[calc(100vh-10rem)] xl:flex xl:flex-col xl:justify-center">
      <div className="text-center space-y-3 sm:space-y-6">
        <div className="flex justify-center">
          <Film className="h-10 w-10 sm:h-16 sm:w-16 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight px-4 bg-gradient-to-r from-primary via-amber-300 to-primary bg-[length:200%_auto] animate-[gradient_6s_linear_infinite] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(243,217,107,0.3)]">
          Movie Release Tracker
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground/90 max-w-2xl mx-auto px-4 leading-relaxed">
          Never miss a movie release again. Get notified when your favorite movies
          are available in theaters or for streaming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Discover Movies */}
        <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-0 md:space-y-3 p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
          <div className="flex-shrink-0 bg-primary/10 rounded-full p-3">
            <Search className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <div className="flex-1 md:flex-none">
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Discover Movies</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Search for upcoming movies and add them to your watchlist
            </p>
          </div>
        </div>

        {/* Get Notified */}
        <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-0 md:space-y-3 p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
          <div className="flex-shrink-0 bg-primary/10 rounded-full p-3">
            <Bell className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <div className="flex-1 md:flex-none">
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Get Notified</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Receive email notifications when your movies are released
            </p>
          </div>
        </div>

        {/* Track Releases */}
        <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-0 md:space-y-3 p-4 sm:p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
          <div className="flex-shrink-0 bg-primary/10 rounded-full p-3">
            <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <div className="flex-1 md:flex-none">
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Track Releases</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Choose theatrical, streaming, or both notification types
            </p>
          </div>
        </div>
      </div>

      <Card className="max-w-lg mx-auto border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <CardTitle className="text-xl sm:text-2xl">Ready to get started?</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Join thousands tracking their favorite movies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button asChild size="lg" className="w-full sm:flex-1 text-base sm:text-lg h-12 sm:h-11 shadow-[0_0_15px_rgba(243,217,107,0.2)] hover:shadow-[0_0_15px_rgba(243,217,107,0.3)] transition-shadow">
              <Link href="/auth/signup" className="flex items-center justify-center gap-2.5">
                <UserPlus className="h-5 w-5" />
                <span className="whitespace-nowrap">Sign Up</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:flex-1 text-base sm:text-lg h-12 sm:h-11 border-2 border-primary/40 hover:border-primary/60 hover:border-[2.5px] hover:bg-accent/50 transition-all">
              <Link href="/auth/signin" className="flex items-center justify-center gap-2.5">
                <LogIn className="h-5 w-5" />
                <span className="whitespace-nowrap">Sign In</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
