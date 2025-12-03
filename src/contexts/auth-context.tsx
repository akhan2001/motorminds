'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  shopId: string | null
  userRole: string | null
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [shopId, setShopId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch user profile data (shop_id and role)
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('shop_id, role')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Failed to fetch user profile:', error)
        return { shopId: null, role: null }
      }

      return {
        shopId: data?.shop_id || null,
        role: data?.role || null
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return { shopId: null, role: null }
    }
  }, [supabase])

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      // Use getSession() instead of getUser() - it's cached and doesn't trigger token refresh
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
        setUser(null)
        setSession(null)
        setShopId(null)
        setUserRole(null)
        setLoading(false)
        return
      }

      if (!currentSession?.user) {
        setUser(null)
        setSession(null)
        setShopId(null)
        setUserRole(null)
        setLoading(false)
        return
      }

      // Set user and session first
      setUser(currentSession.user)
      setSession(currentSession)

      // Then fetch profile data
      const profile = await fetchUserProfile(currentSession.user.id)
      setShopId(profile.shopId)
      setUserRole(profile.role)
      setLoading(false)
    } catch (error) {
      console.error('Error initializing auth:', error)
      setLoading(false)
    }
  }, [supabase, fetchUserProfile])

  // Refresh auth state manually
  const refreshAuth = useCallback(async () => {
    setLoading(true)
    await initializeAuth()
  }, [initializeAuth])

  // Initialize on mount
  useEffect(() => {
    initializeAuth()

    // Set up auth state change listener (ONLY ONE for the entire app)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[AuthProvider] Auth state changed:', event)

      // Only handle actual auth changes, not token refreshes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        if (!newSession?.user) {
          setUser(null)
          setSession(null)
          setShopId(null)
          setUserRole(null)
          setLoading(false)
          return
        }

        setUser(newSession.user)
        setSession(newSession)

        // Fetch fresh profile data
        const profile = await fetchUserProfile(newSession.user.id)
        setShopId(profile.shopId)
        setUserRole(profile.role)
        setLoading(false)
      }
      // Ignore TOKEN_REFRESHED events to prevent unnecessary refetches
    })

    return () => subscription.unsubscribe()
  }, [supabase, initializeAuth, fetchUserProfile])

  const value: AuthContextType = {
    user,
    session,
    loading,
    shopId,
    userRole,
    refreshAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Convenience hooks
export function useUser() {
  const { user, loading } = useAuth()
  return { user, loading }
}

export function useSession() {
  const { session, loading } = useAuth()
  return { session, loading }
}

export function useUserShopId() {
  const { shopId, loading } = useAuth()
  return { shopId, loading }
}

export function useUserRoleFromAuth() {
  const { userRole, loading } = useAuth()
  return { userRole, loading }
}
