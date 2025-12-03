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
 * Now uses centralized AuthProvider which fetches shop info alongside user data.
 * This prevents duplicate queries and the thundering herd problem.
 * 
 * @deprecated The old React Query implementation has been replaced with centralized auth.
 */
export function useShopInfo() {
    const { shopInfo, loading } = useAuth()

    return {
        data: shopInfo as ShopInfo | null,
        isLoading: loading,
        error: null,
        refetch: () => Promise.resolve({ data: shopInfo }),
    }
}
