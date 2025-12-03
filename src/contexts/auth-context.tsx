'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface ShopInfo {
  id: string
  shop_name: string
  shop_owner: string
  logo_image_url: string | null
  shop_email: string | null
  shop_phone: string | null
  shop_address: string | null
  shop_city: string | null
  shop_province: string | null
  business_number: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  shopId: string | null
  userRole: string | null
  shopInfo: ShopInfo | null
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [shopId, setShopId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)

  const supabase = createClient()

  // Fetch user profile data (shop_id, role, AND shop info in one go)
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('shop_id, role')
        .eq('id', userId)
        .maybeSingle()

      if (userError) {
        console.warn('Failed to fetch user profile:', userError)
        return { shopId: null, role: null, shopInfo: null }
      }

      const fetchedShopId = userData?.shop_id || null
      const fetchedRole = userData?.role || null

      // If we have a shopId, fetch shop info immediately
      let fetchedShopInfo: ShopInfo | null = null
      if (fetchedShopId) {
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('id, shop_name, shop_owner, logo_image_url, shop_email, shop_phone, shop_address, shop_city, shop_province, business_number')
          .eq('id', fetchedShopId)
          .maybeSingle()

        if (shopError) {
          console.warn('Failed to fetch shop info:', shopError)
        } else {
          fetchedShopInfo = shopData
        }
      }

      return {
        shopId: fetchedShopId,
        role: fetchedRole,
        shopInfo: fetchedShopInfo
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return { shopId: null, role: null, shopInfo: null }
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
        setShopInfo(null)
        setLoading(false)
        return
      }

      if (!currentSession?.user) {
        setUser(null)
        setSession(null)
        setShopId(null)
        setUserRole(null)
        setShopInfo(null)
        setLoading(false)
        return
      }

      // Set user and session first
      setUser(currentSession.user)
      setSession(currentSession)

      // Then fetch profile data AND shop info in one go
      const profile = await fetchUserProfile(currentSession.user.id)
      setShopId(profile.shopId)
      setUserRole(profile.role)
      setShopInfo(profile.shopInfo)
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[AuthProvider] Auth state changed:', event)

      // FAST synchronous state updates ONLY - no async, no awaits, no DB calls
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Just update session state immediately
        setUser(newSession?.user || null)
        setSession(newSession)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        // Clear state immediately
        setUser(null)
        setSession(null)
        setShopId(null)
        setUserRole(null)
        setShopInfo(null)
        setLoading(false)
      }

      // Run async operations OUTSIDE the callback to prevent refresh loops
      setTimeout(async () => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            // Now safe to fetch profile data
            const profile = await fetchUserProfile(newSession.user.id)
            setShopId(profile.shopId)
            setUserRole(profile.role)
            setShopInfo(profile.shopInfo)
          }
        }
        // SIGNED_OUT already handled synchronously above
      }, 0)
    })

    return () => subscription.unsubscribe()
  }, [supabase, initializeAuth, fetchUserProfile])

  const value: AuthContextType = {
    user,
    session,
    loading,
    shopId,
    userRole,
    shopInfo,
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

export function useShopInfoFromAuth() {
  const { shopInfo, loading } = useAuth()
  return { shopInfo, loading }
}
