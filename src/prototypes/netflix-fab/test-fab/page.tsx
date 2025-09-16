'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/components/providers/auth-provider'
import { MovieWithDates } from '@/types/movie'
import NetflixFABCard from '../netflix-fab-card'
import { redirect } from 'next/navigation'

export default function TestFABPage() {
  const [movies, setMovies] = useState<MovieWithDates[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated, loading: authLoading } = useAuthContext()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      redirect('/auth/signin')
    }
  }, [isAuthenticated, authLoading])

  // Fetch popular movies
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchMovies = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/movies/popular?page=1')

        if (!response.ok) {
          throw new Error('Failed to fetch movies')
        }

        const data = await response.json()
        setMovies(data.results.slice(0, 8)) // Show first 8 movies for testing
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load movies')
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [isAuthenticated])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Checking authentication...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading movies...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-lg">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Netflix FAB Card Test</h1>
          <p className="text-gray-400">
            Testing Netflix-style FAB cards with real movie data and follow functionality
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Logged in as: {user?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <NetflixFABCard key={movie.id} movie={movie} />
          ))}
        </div>

        {movies.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <p>No movies found</p>
          </div>
        )}
      </div>
    </div>
  )
}