'use client'

// Client-side authentication hooks

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserRole, UserProfile } from './types'

/**
 * Hook to get current user
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

/**
 * Hook to get current session
 */
export function useSession() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { user, loading } = useUser()
  return { isAuthenticated: !!user, loading }
}

/**
 * Hook to get user profile
 */
export function useUserProfile() {
  const { user, loading: userLoading } = useUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('users')
          .select('id, email, role, shop_id, organization_id')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setProfile(data as UserProfile)
        setError(null)
      } catch (err: any) {
        setError(err.message)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  return { profile, loading: userLoading || loading, error }
}

/**
 * Hook to get user role
 */
export function useUserRole() {
  const { profile, loading, error } = useUserProfile()
  return { role: profile?.role, loading, error }
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const { role, loading } = useUserRole()

  const isAdmin =
    role?.toUpperCase() === 'ADMIN' ||
    role?.toUpperCase() === 'SUPER-ADMIN' ||
    role?.toUpperCase() === 'SUPER_ADMIN' ||
    role?.toUpperCase() === 'SHOP_ADMIN' ||
    role?.toUpperCase() === 'ORGANIZATION_ADMIN'

  return { isAdmin, loading }
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(requiredRole: UserRole) {
  const { role, loading } = useUserRole()
  const hasRole = role?.toLowerCase() === requiredRole.toLowerCase()
  return { hasRole, loading }
}

/**
 * Hook to get user's shop ID
 */
export function useShopId() {
  const { user, loading: userLoading } = useUser()
  const { profile, loading: profileLoading } = useUserProfile()

  const shopId = user?.user_metadata?.shop_id || profile?.shop_id

  return { shopId, loading: userLoading || profileLoading }
}

/**
 * Hook for logout functionality
 */
export function useLogout() {
  const [loading, setLoading] = useState(false)

  const logout = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setLoading(false)
    }
  }

  return { logout, loading }
}
