import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date + 'T00:00:00') // Timezone-safe parsing
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date + 'T00:00:00') // Timezone-safe parsing
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isDateToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return date === today
}

export function isDateInPast(date: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return date < today
}

export function isDateInFuture(date: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return date > today
}