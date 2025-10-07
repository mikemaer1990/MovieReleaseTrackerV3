'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Search, User, LogOut, UserPlus, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  isAuthenticated: boolean
  user?: { name?: string; email?: string } | null
  onSignOut?: () => void
}

export function MobileMenu({
  isOpen,
  onClose,
  isAuthenticated,
  user,
  onSignOut,
}: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const [backdropClickable, setBackdropClickable] = useState(false)

  // Enable backdrop clicks after a short delay to prevent immediate closure
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setBackdropClickable(true), 150)
      return () => clearTimeout(timer)
    } else {
      setBackdropClickable(false)
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if the click was directly on the backdrop, not propagated from elsewhere
    if (backdropClickable && e.target === backdropRef.current) {
      onClose()
    }
  }

  // Close menu on route change - Next.js 15 uses usePathname hook
  const pathname = usePathname()
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={cn(
          "fixed top-16 left-0 right-0 bottom-0 bg-black/80 z-40 md:hidden",
          "transition-opacity duration-200 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          !backdropClickable && "pointer-events-none"
        )}
        onClick={handleBackdropClick}
      />

      {/* Mobile Menu */}
      <div
        ref={menuRef}
        className={cn(
          "fixed top-16 left-0 right-0 bg-card border-b border-border z-50 md:hidden",
          "transform transition-all duration-300 ease-out origin-top",
          isOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="container mx-auto px-4 py-6">
          {isAuthenticated ? (
            <nav className="space-y-6">
              {/* User Welcome */}
              <div className="flex items-center space-x-3 pb-4 border-b border-border">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Welcome, {user?.name || user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-4">
                <Link
                  href="/search"
                  className={cn(
                    "flex items-center space-x-3 py-3 px-4 rounded-lg",
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                    "transition-colors duration-200 ease-in-out",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  )}
                  onClick={onClose}
                >
                  <Search className="h-5 w-5" />
                  <span className="text-base font-medium">Search Movies</span>
                </Link>

                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center space-x-3 py-3 px-4 rounded-lg",
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                    "transition-colors duration-200 ease-in-out",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  )}
                  onClick={onClose}
                >
                  <User className="h-5 w-5" />
                  <span className="text-base font-medium">My Movies</span>
                </Link>

                <Link
                  href="/upcoming"
                  className={cn(
                    "flex items-center space-x-3 py-3 px-4 rounded-lg",
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                    "transition-colors duration-200 ease-in-out",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  )}
                  onClick={onClose}
                >
                  <div className="h-5 w-5 flex items-center justify-center">📅</div>
                  <span className="text-base font-medium">Upcoming Releases</span>
                </Link>
              </div>

              {/* Sign Out Button */}
              <div className="pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onSignOut?.()
                    onClose()
                  }}
                  className={cn(
                    "w-full justify-start space-x-3 py-3 px-4 h-auto",
                    "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-base font-medium">Sign Out</span>
                </Button>
              </div>
            </nav>
          ) : (
            /* Unauthenticated Menu */
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-4">
                  Sign in to track your favorite movies
                </p>
                <div className="space-y-3">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    onClick={onClose}
                  >
                    <Link href="/auth/signin" className="flex items-center justify-center gap-2">
                      <LogIn className="h-4 w-4" />
                      <span>Sign In</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full"
                    onClick={onClose}
                  >
                    <Link href="/auth/signup" className="flex items-center justify-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      <span>Sign Up</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}