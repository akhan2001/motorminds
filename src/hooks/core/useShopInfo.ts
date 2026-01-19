import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'

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
    hst_number?: string
}

/**
 * Hook to get shop information using centralized auth context
 * Uses shopId from AuthProvider - no redundant getUser() call
 */
export function useShopInfo() {
    const supabase = createClient()
    const { shopId } = useAuth()

    return useQuery({
        queryKey: ['shop-info', shopId],
        queryFn: async (): Promise<ShopInfo | null> => {
            try {
                if (!shopId) return null

                // Get shop information directly using shopId from context
                const { data: shopData, error: shopError } = await supabase
                    .from('shops')
                    .select('id, shop_name, shop_owner, logo_image_url, shop_email, shop_phone, shop_address, shop_city, shop_province, business_number, hst_number')
                    .eq('id', shopId)
                    .single()

                if (shopError || !shopData) return null

                return shopData
            } catch (error) {
                console.error('Error fetching shop info:', error)
                return null
            }
        },
        enabled: !!shopId, // Only run query if shopId exists
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1
    })
}
