'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AuthUser } from '@/types/user'
import { AuthService } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Memoize user object to prevent unnecessary re-renders
  const stableUser = useMemo(() => user, [user?.id, user?.email, user?.name])

  const updateUser = useCallback((newUser: AuthUser | null) => {
    // Only update if the user data actually changed
    setUser(current => {
      if (!current && !newUser) return current
      if (!current || !newUser) return newUser
      if (current.id === newUser.id && 
          current.email === newUser.email && 
          current.name === newUser.name) {
        return current // Return same reference to prevent re-renders
      }
      return newUser
    })
  }, [])

  useEffect(() => {
    // Get initial user
    AuthService.getCurrentUser()
      .then(updateUser)
      .finally(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(updateUser)

    return () => subscription.unsubscribe()
  }, [updateUser])

  const syncUser = async () => {
    try {
      const { data: { session } } = await AuthService.supabase.auth.getSession()
      if (!session?.access_token) return

      await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
    } catch (error) {
      console.error('Error syncing user:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      await AuthService.signIn({ email, password })
      // Sync user to our database
      setTimeout(syncUser, 500) // Small delay to ensure auth state is updated
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      await AuthService.signUp({ email, password, name })
      // Sync user to our database
      setTimeout(syncUser, 500) // Small delay to ensure auth state is updated
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await AuthService.signOut()
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email)
  }

  const updateProfile = async (name: string) => {
    await AuthService.updateProfile(name)
    // Refresh user data
    const updatedUser = await AuthService.getCurrentUser()
    updateUser(updatedUser)
  }

  return {
    user: stableUser,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    isAuthenticated: !!stableUser,
  }
}