'use client'

import { useState, useEffect, useCallback } from 'react'
import { FollowType } from '@/types/movie'
import { useAuthContext } from '@/components/providers/auth-provider'
import { supabase } from '@/lib/supabase'

interface FollowHookResult {
  followMovie: (movieId: number, followType: FollowType) => Promise<void>
  unfollowMovie: (movieId: number, followType?: FollowType) => Promise<void>
  checkFollowStatus: (movieId: number) => Promise<FollowType[]>
  getUserFollows: () => Promise<unknown[]>
  loading: boolean
}

export function useFollows(): FollowHookResult {
  const [loading, setLoading] = useState(false)
  const { user } = useAuthContext()

  // Helper function to get auth headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No valid session')
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    }
  }

  const followMovie = useCallback(async (movieId: number, followType: FollowType) => {
    if (!user) throw new Error('User not authenticated')
    
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/follows', {
        method: 'POST',
        headers,
        body: JSON.stringify({ movieId, followType }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to follow movie')
      }

      return await response.json()
    } finally {
      setLoading(false)
    }
  }, [user])

  const unfollowMovie = useCallback(async (movieId: number, followType?: FollowType) => {
    if (!user) throw new Error('User not authenticated')
    
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams({
        movieId: movieId.toString(),
        ...(followType && { followType }),
      })

      const response = await fetch(`/api/follows?${params}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unfollow movie')
      }

      return await response.json()
    } finally {
      setLoading(false)
    }
  }, [user])

  const checkFollowStatus = useCallback(async (movieId: number): Promise<FollowType[]> => {
    if (!user) return []
    
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/follows/${movieId}`, {
        headers,
      })
      
      if (!response.ok) {
        if (response.status === 401) return []
        const error = await response.json()
        throw new Error(error.error || 'Failed to check follow status')
      }

      const data = await response.json()
      return data.followTypes || []
    } catch (error) {
      console.error('Error checking follow status:', error)
      return []
    }
  }, [user])

  const getUserFollows = useCallback(async () => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/follows', {
        headers,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get follows')
      }

      const data = await response.json()
      return data.follows || []
    } catch (error) {
      console.error('Error getting user follows:', error)
      return []
    }
  }, [user])

  return {
    followMovie,
    unfollowMovie,
    checkFollowStatus,
    getUserFollows,
    loading,
  }
}

// Hook for managing follow status of a specific movie
export function useMovieFollowStatus(movieId: number) {
  const [followTypes, setFollowTypes] = useState<FollowType[]>([])
  const [loading, setLoading] = useState(true)
  const { checkFollowStatus } = useFollows()
  const { user } = useAuthContext()

  useEffect(() => {
    if (!user || !movieId) {
      setLoading(false)
      return
    }

    const fetchFollowStatus = async () => {
      try {
        const types = await checkFollowStatus(movieId)
        setFollowTypes(types)
      } catch (error) {
        console.error('Error fetching follow status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFollowStatus()
  }, [movieId, user, checkFollowStatus])

  const isFollowing = followTypes.length > 0
  const followingTypes = followTypes

  return {
    isFollowing,
    followingTypes,
    loading,
    refreshStatus: async () => {
      setLoading(true)
      try {
        const types = await checkFollowStatus(movieId)
        setFollowTypes(types)
      } finally {
        setLoading(false)
      }
    }
  }
}