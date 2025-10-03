'use client'

import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, Search, Calendar, Bell } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user, isAuthenticated, loading } = useAuthContext()

  // Show nothing while checking authentication to prevent flash
  if (loading) {
    return null
  }

  if (isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-primary">Welcome back, {user?.name || user?.email}!</h1>
          <p className="text-xl text-muted-foreground">
            Ready to discover your next favorite movie?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:bg-accent/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Search Movies</span>
              </CardTitle>
              <CardDescription>
                Find new movies to follow and get notified when they're released
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/search">Start Searching</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Film className="h-5 w-5 text-primary" />
                <span>My Movies</span>
              </CardTitle>
              <CardDescription>
                Manage your followed movies and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:bg-accent/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Upcoming Releases</span>
              </CardTitle>
              <CardDescription>
                See what movies are releasing soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/upcoming">Browse Releases</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Film className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold text-primary">Movie Release Tracker</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Never miss a movie release again. Get notified when your favorite movies 
          are available in theaters or for streaming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Search className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Discover Movies</h3>
          <p className="text-muted-foreground">
            Search for upcoming movies and add them to your watchlist
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Bell className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Get Notified</h3>
          <p className="text-muted-foreground">
            Receive email notifications when your movies are released
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Calendar className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Track Releases</h3>
          <p className="text-muted-foreground">
            Choose theatrical, streaming, or both notification types
          </p>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Ready to get started?</h2>
        <div className="flex justify-center space-x-4">
          <Button asChild size="lg">
            <Link href="/auth/signup">Sign Up Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
