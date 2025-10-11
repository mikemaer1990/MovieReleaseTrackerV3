'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  leftIcon?: React.ReactNode
  rightAction?: React.ReactNode
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, leftIcon, rightAction, type, value, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const hasValue = value !== undefined && value !== ''

    const shouldFloat = isFocused || hasValue

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "peer flex h-12 w-full rounded-md border border-input bg-background px-3 pt-5 pb-1 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-transparent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            leftIcon && "pl-10",
            rightAction && "pr-10",
            className
          )}
          ref={ref}
          value={value}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />

        {/* Floating Label */}
        <label
          className={cn(
            "absolute left-3 text-muted-foreground pointer-events-none transition-all duration-200 ease-out",
            leftIcon && "left-10",
            shouldFloat
              ? "top-1 text-xs font-medium text-primary"
              : "top-3.5 text-sm"
          )}
        >
          {label}
        </label>

        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none">
            {leftIcon}
          </div>
        )}

        {/* Right Action (e.g., password toggle) */}
        {rightAction && (
          <div className="absolute right-3 top-3.5">
            {rightAction}
          </div>
        )}
      </div>
    )
  }
)

FloatingInput.displayName = "FloatingInput"

export { FloatingInput }
