import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { MiaCustomerInsight, InsightsResponse } from '../types/mia-insights'

// Hook for fetching MIA insights from database
export const useMiaInsights = (workOrderId: string, shopId: string) => {
    return useQuery({
        queryKey: ['mia-insights', workOrderId, shopId],
        queryFn: async (): Promise<MiaCustomerInsight | null> => {
            const { data, error } = await supabase
                .from('mia_insights')
                .select('*')
                .eq('work_order_id', workOrderId)
                .eq('shop_id', shopId)
                .maybeSingle()

            if (error) {
                console.error('Error fetching MIA insights:', error)
                return null
            }

            return data
        },
        enabled: !!workOrderId && !!shopId
    })
}

// Hook for generating MIA insights
export const useGenerateMiaInsights = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: async ({ workOrderId, shopId }: { workOrderId: string, shopId: string }): Promise<InsightsResponse> => {
            const response = await fetch('/api/mia-insights/work-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ workOrderId, shopId })
            })

            if (!response.ok) {
                throw new Error('Failed to generate insights')
            }

            return response.json()
        },
        onSuccess: (data, variables) => {
            // Invalidate and refetch insights for this work order
            queryClient.invalidateQueries({
                queryKey: ['mia-insights', variables.workOrderId, variables.shopId]
            })
        }
    })
}
