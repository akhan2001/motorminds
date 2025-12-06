import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

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

export function useShopInfo() {
    const supabase = createClient()

    return useQuery({
        queryKey: ['shop-info'],
        queryFn: async (): Promise<ShopInfo | null> => {
            try {
                // Use getClaims() for robust JWT validation
                const { data } = await supabase.auth.getClaims()
                if (!data?.claims?.sub) return null

                const userId = data.claims.sub

                // Get user's shop_id
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('shop_id')
                    .eq('id', userId)
                    .single()

                if (userError || !userData?.shop_id) return null

                // Get shop information
                const { data: shopData, error: shopError } = await supabase
                    .from('shops')
                    .select('id, shop_name, shop_owner, logo_image_url, shop_email, shop_phone, shop_address, shop_city, shop_province, business_number')
                    .eq('id', userData.shop_id)
                    .single()

                if (shopError || !shopData) return null

                return shopData
            } catch (error) {
                console.error('Error fetching shop info:', error)
                return null
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1
    })
}
