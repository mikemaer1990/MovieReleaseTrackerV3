'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { HamburgerButton } from '@/components/ui/hamburger-button'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { Film, Search, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const { user, signOut, isAuthenticated, loading } = useAuthContext()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Hide desktop auth buttons on homepage for cleaner landing page
  const isHomepage = pathname === '/'
  const showDesktopAuthButtons = !isHomepage || isAuthenticated

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  return (
    <>
      <header className="border-b border-border/50 bg-card/95 backdrop-blur-sm sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center min-w-0">
              <Link href="/" className="flex items-center gap-2.5 font-bold text-primary hover:text-primary/80 transition-colors group">
                <Film className="h-6 w-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-lg sm:text-xl hidden sm:inline truncate">Movie Release Tracker</span>
                <span className="text-lg sm:text-xl sm:hidden">MRT</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {!loading && isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/search"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                    pathname === '/search'
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                  {pathname === '/search' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                    pathname === '/dashboard'
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  My Movies
                  {pathname === '/dashboard' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
                <Link
                  href="/upcoming"
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors relative",
                    pathname === '/upcoming'
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  Upcoming
                  {pathname === '/upcoming' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              </nav>
            )}

            {/* Desktop Auth Section */}
            {showDesktopAuthButtons && (
              <div className="hidden md:flex items-center gap-3">
                {loading ? (
                  <div className="w-32 h-8" />
                ) : isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                      {user?.name || user?.email}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signOut}
                      className="flex items-center gap-2 hover:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/auth/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <HamburgerButton
              isOpen={isMobileMenuOpen}
              onClick={toggleMobileMenu}
            />
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        isAuthenticated={isAuthenticated}
        user={user ? { name: user.name || undefined, email: user.email || undefined } : null}
        onSignOut={signOut}
      />
    </>
  )
}