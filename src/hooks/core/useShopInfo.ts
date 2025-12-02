import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase' // Use singleton client to prevent refresh loops

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
    // Use singleton client instead of creating new one on every render
    // This prevents token refresh loops

    return useQuery({
        queryKey: ['shop-info'],
        queryFn: async (): Promise<ShopInfo | null> => {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return null

                // Get user's shop_id
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('shop_id')
                    .eq('id', user.id)
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
        refetchOnMount: false,
        retry: 1
    })
}
