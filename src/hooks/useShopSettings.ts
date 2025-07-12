import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'

const supabase = createClientComponentClient()

// Types
export interface ShopInfo {
    id: string
    shop_name: string
    shop_email: string
    shop_phone: string
    shop_address: string
    shop_city: string
    shop_province: string
    shop_owner: string
    shop_about: string
    shop_tagline: string
    operating_hours: string
    services_offered: string
    website: string
    logo_image_url: string
    banner_image_url: string
    facebook_url: string
    twitter_url: string
    instagram_url: string
    youtube_url: string
    hst_number: string
    business_number: string
    created_at: string
    updated_at: string
}

// Shop Info Query
export function useShopInfo(shopId: string | null) {
    return useQuery({
        queryKey: ['shop-info', shopId],
        queryFn: async (): Promise<ShopInfo> => {
            if (!shopId) throw new Error('Shop ID is required')
            
            const { data, error } = await supabase
                .from('shops')
                .select('*')
                .eq('id', shopId)
                .single()
            
            if (error) throw error
            return data
        },
        enabled: !!shopId,
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
    })
}

// Update Shop Info Mutation
export function useUpdateShopInfo() {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async ({ shopId, updates }: { shopId: string; updates: Partial<ShopInfo> }) => {
            const { data, error } = await supabase
                .from('shops')
                .update(updates)
                .eq('id', shopId)
                .select()
                .single()
            
            if (error) {
                // Handle specific constraint errors
                if (error.code === '23505') {
                    if (error.message.includes('business_number')) {
                        throw new Error('Business number already exists. Please use a different number.')
                    } else if (error.message.includes('shop_email')) {
                        throw new Error('Email already exists. Please use a different email.')
                    } else {
                        throw new Error('A record with this information already exists.')
                    }
                }
                throw error
            }
            return data
        },
        onSuccess: (data, { shopId }) => {
            // Invalidate and refetch shop info
            queryClient.invalidateQueries({ queryKey: ['shop-info', shopId] })
            toast.success('Shop information updated successfully')
        },
        onError: (error) => {
            console.error('Error updating shop info:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to update shop information'
            toast.error(errorMessage)
        },
    })
}

// Combined hook for all shop settings data
export function useShopSettings(shopId: string | null) {
    const shopInfo = useShopInfo(shopId)
    const updateShopInfo = useUpdateShopInfo()
    
    return {
        shopInfo,
        updateShopInfo,
        isLoading: shopInfo.isLoading,
        error: shopInfo.error,
    }
} 