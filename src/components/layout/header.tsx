'use client'

import Link from 'next/link'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Film, Search, User, LogOut } from 'lucide-react'

export function Header() {
  const { user, signOut, isAuthenticated } = useAuthContext()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 font-bold text-primary">
              <Film className="h-6 w-6" />
              <span className="text-xl">Movie Release Tracker</span>
            </Link>
            
            {isAuthenticated && (
              <nav className="flex items-center space-x-6">
                <Link 
                  href="/search" 
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-muted-foreground hover:text-foreground"
                >
                  My Movies
                </Link>
                <Link 
                  href="/upcoming" 
                  className="text-muted-foreground hover:text-foreground"
                >
                  Upcoming
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.name || user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}