'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import type { TwilioPhoneNumber } from '../types/sms'

const supabase = createClient()

// Query keys factory
export const phoneNumberKeys = {
    all: ['twilio-phone-numbers'] as const,
    list: (shopId: string) => [...phoneNumberKeys.all, 'list', shopId] as const,
}

/**
 * Fetch shop's Twilio phone numbers
 */
async function fetchPhoneNumbers(shopId: string): Promise<TwilioPhoneNumber[]> {
    const { data, error } = await supabase
        .from('twilio_phone_numbers')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', 'active')

    if (error) throw error
    return (data || []) as TwilioPhoneNumber[]
}

/**
 * Hook: List Twilio phone numbers for a shop
 */
export function useTwilioPhoneNumbers(shopId: string) {
    return useQuery({
        queryKey: phoneNumberKeys.list(shopId),
        queryFn: () => fetchPhoneNumbers(shopId),
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000, // 5 minutes (phone numbers rarely change)
    })
}

/**
 * Hook: Check if shop has active phone numbers
 */
export function useHasPhoneNumbers(shopId: string) {
    const { data, isLoading, error } = useTwilioPhoneNumbers(shopId)
    
    return {
        hasPhoneNumbers: (data?.length ?? 0) > 0,
        isLoading,
        error,
    }
}
