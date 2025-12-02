// Legacy hook - now uses unified auth context
// Keeping this file for backward compatibility
import { useUnifiedAuth } from '@/contexts/unified-auth-context';

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
    const { shopInfo, isLoading } = useUnifiedAuth();

    return {
        data: shopInfo,
        isLoading,
        error: null,
        refetch: () => Promise.resolve(), // No-op for backward compatibility
    };
}
