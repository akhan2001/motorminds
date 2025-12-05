import { useAuth } from '@/contexts/auth-provider'

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
 * Hook to get shop info from centralized AuthProvider
 * This prevents duplicate API calls and "thundering herd" problem
 * 
 * @deprecated Use useAuth() directly instead for better performance
 */
export function useShopInfo() {
    const { shopInfo, loading } = useAuth()

    return {
        data: shopInfo,
        isLoading: loading,
        error: null,
        refetch: () => Promise.resolve({ data: shopInfo })
    }
}
