import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/auth-context'

interface ShopInfo {
    id: string
    shop_name: string
    shop_owner: string
    logo_image_url?: string
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    shop_city?: string
    shop_province?: string
    business_number?: string
}

/**
 * Hook to get shop information for the current user.
 * Uses centralized auth to get shopId, preventing duplicate auth calls.
 */
export function useShopInfo() {
    const supabase = createClient()
    const { shopId, loading: authLoading } = useAuth()

    return useQuery({
        queryKey: ['shop-info', shopId],
        queryFn: async (): Promise<ShopInfo | null> => {
            // Don't fetch if we don't have a shopId yet
            if (!shopId) return null

            try {
                // Get shop information using shopId from centralized auth
                const { data: shopData, error: shopError } = await supabase
                    .from('shops')
                    .select('id, shop_name, shop_owner, logo_image_url, shop_email, shop_phone, shop_address, shop_city, shop_province, business_number')
                    .eq('id', shopId)
                    .single()

                if (shopError || !shopData) {
                    console.warn('Error fetching shop info:', shopError)
                    return null
                }

                return shopData
            } catch (error) {
                console.error('Error fetching shop info:', error)
                return null
            }
        },
        // Only enable query when we have shopId and auth is not loading
        enabled: !!shopId && !authLoading,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1
    })
}
