'use client'

import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
  className?: string
}

export function HamburgerButton({ isOpen, onClick, className }: HamburgerButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "md:hidden relative p-2 h-10 w-10",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      <div className="relative w-6 h-6">
        {/* Menu Icon */}
        <Menu
          className={cn(
            "absolute inset-0 h-6 w-6 transition-all duration-300 ease-in-out",
            isOpen
              ? "opacity-0 rotate-180 scale-0"
              : "opacity-100 rotate-0 scale-100"
          )}
        />

        {/* X Icon */}
        <X
          className={cn(
            "absolute inset-0 h-6 w-6 transition-all duration-300 ease-in-out",
            isOpen
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-180 scale-0"
          )}
        />
      </div>
    </Button>
  )
}