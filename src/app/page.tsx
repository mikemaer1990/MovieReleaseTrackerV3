'use client'

import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, Search, Calendar, Bell, UserPlus, LogIn, ChevronRight } from 'lucide-react'
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Search Movies */}
          <Link
            href="/search"
            className="group flex items-center justify-between p-3 md:flex-col md:items-stretch md:text-center md:gap-0 md:space-y-3 md:p-6 bg-card border border-border rounded-lg hover:border-primary/50 active:bg-accent/10 transition-colors"
          >
            <div className="flex items-center gap-3 md:flex-col md:gap-0 md:flex-1">
              <div className="flex-shrink-0 bg-primary/10 rounded-full p-2 md:p-3">
                <Search className="h-6 w-6 md:h-10 md:w-10 text-primary" />
              </div>
              <div className="md:mt-3 md:flex md:flex-col md:flex-1 md:w-full">
                <h3 className="text-base md:text-xl font-semibold">Search Movies</h3>
                <p className="hidden md:block text-sm md:text-base text-muted-foreground mt-2 mb-4 md:flex-1">
                  Find new movies to follow and get notified when they&apos;re released
                </p>
                <Button className="hidden md:flex w-full shadow-[0_0_15px_rgba(243,217,107,0.2)] hover:shadow-[0_0_15px_rgba(243,217,107,0.3)] transition-shadow pointer-events-none">
                  Start Searching
                </Button>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground md:hidden flex-shrink-0" />
          </Link>

          {/* My Movies */}
          <Link
            href="/dashboard"
            className="group flex items-center justify-between p-3 md:flex-col md:items-stretch md:text-center md:gap-0 md:space-y-3 md:p-6 bg-card border border-border rounded-lg hover:border-primary/50 active:bg-accent/10 transition-colors"
          >
            <div className="flex items-center gap-3 md:flex-col md:gap-0 md:flex-1">
              <div className="flex-shrink-0 bg-primary/10 rounded-full p-2 md:p-3">
                <Film className="h-6 w-6 md:h-10 md:w-10 text-primary" />
              </div>
              <div className="md:mt-3 md:flex md:flex-col md:flex-1 md:w-full">
                <h3 className="text-base md:text-xl font-semibold">My Movies</h3>
                <p className="hidden md:block text-sm md:text-base text-muted-foreground mt-2 mb-4 md:flex-1">
                  Manage your followed movies and notification preferences
                </p>
                <Button variant="outline" className="hidden md:flex w-full border-2 border-primary/40 hover:border-primary/60 hover:border-[2.5px] hover:bg-accent/50 transition-all pointer-events-none">
                  View Dashboard
                </Button>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground md:hidden flex-shrink-0" />
          </Link>

          {/* Upcoming Releases */}
          <Link
            href="/upcoming"
            className="group flex items-center justify-between p-3 md:flex-col md:items-stretch md:text-center md:gap-0 md:space-y-3 md:p-6 bg-card border border-border rounded-lg hover:border-primary/50 active:bg-accent/10 transition-colors"
          >
            <div className="flex items-center gap-3 md:flex-col md:gap-0 md:flex-1">
              <div className="flex-shrink-0 bg-primary/10 rounded-full p-2 md:p-3">
                <Calendar className="h-6 w-6 md:h-10 md:w-10 text-primary" />
              </div>
              <div className="md:mt-3 md:flex md:flex-col md:flex-1 md:w-full">
                <h3 className="text-base md:text-xl font-semibold">Upcoming Releases</h3>
                <p className="hidden md:block text-sm md:text-base text-muted-foreground mt-2 mb-4 md:flex-1">
                  See what movies are releasing soon
                </p>
                <Button variant="outline" className="hidden md:flex w-full border-2 border-primary/40 hover:border-primary/60 hover:border-[2.5px] hover:bg-accent/50 transition-all pointer-events-none">
                  Browse Releases
                </Button>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground md:hidden flex-shrink-0" />
          </Link>
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
