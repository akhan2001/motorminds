'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import type { CustomerSegment, SegmentPreview } from '../types/mass-campaign'
import { campaignKeys } from './use-campaigns'

const supabase = createClient()

export function useCampaignPreview(
    shopId: string,
    segment: CustomerSegment,
    enabled = true
) {
    return useQuery({
        queryKey: [...campaignKeys.all, 'preview', shopId, segment] as const,
        queryFn: async (): Promise<SegmentPreview> => {
            // Start with base query
            let query = supabase
                .from('customers')
                .select('id, customer_name, customer_phone, customer_email')
                .eq('shop_id', shopId)
                .not('customer_phone', 'is', null)

            // Apply basic filters
            if (segment.customer_tags && segment.customer_tags.length > 0) {
                query = query.contains('tags', segment.customer_tags)
            }

            if (segment.include_customer_ids && segment.include_customer_ids.length > 0) {
                query = query.in('id', segment.include_customer_ids)
            }

            if (segment.exclude_customer_ids && segment.exclude_customer_ids.length > 0) {
                query = query.not('id', 'in', segment.exclude_customer_ids)
            }

            // Get count first
            const { count, error: countError } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true })
                .eq('shop_id', shopId)
                .not('customer_phone', 'is', null)

            if (countError) throw countError

            // Get sample (first 10)
            const { data: sample, error: sampleError } = await query.limit(10)

            if (sampleError) throw sampleError

            return {
                count: count || 0,
                sample_customers: sample || []
            }
        },
        enabled: enabled && !!shopId && Object.keys(segment).length > 0,
        staleTime: 30 * 1000, // 30 seconds
    })
}