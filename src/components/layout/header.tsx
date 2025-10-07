'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthContext } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { HamburgerButton } from '@/components/ui/hamburger-button'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { Film, Search, LogOut } from 'lucide-react'

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
      <header className="border-b border-border bg-card relative z-30">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 font-bold text-primary">
                <Film className="h-6 w-6" />
                <span className="text-xl hidden sm:inline">Movie Release Tracker</span>
                <span className="text-xl sm:hidden">MRT</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {!loading && isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/search"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Movies
                </Link>
                <Link
                  href="/upcoming"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Upcoming
                </Link>
              </nav>
            )}

            {/* Desktop Auth Section */}
            {showDesktopAuthButtons && (
              <div className="hidden md:flex items-center space-x-4">
                {loading ? (
                  <div className="w-32 h-8" />
                ) : isAuthenticated ? (
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