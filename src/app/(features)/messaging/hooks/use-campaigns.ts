'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import type { MassCampaign, MassCampaignCreateData, MassCampaignUpdateData, CampaignStats } from '../types/mass-campaign'

const supabase = createClient()

// Query keys
export const campaignKeys = {
    all: ['campaigns'] as const,
    lists: () => [...campaignKeys.all, 'list'] as const,
    list: (shopId: string, filters?: any) => [...campaignKeys.lists(), shopId, filters] as const,
    details: () => [...campaignKeys.all, 'detail'] as const,
    detail: (id: string) => [...campaignKeys.details(), id] as const,
    stats: (shopId: string) => [...campaignKeys.all, 'stats', shopId] as const,
}

// Hook: List all campaigns
export function useCampaigns(
    shopId: string,
    filters?: { status?: string; search?: string }
) {
    return useQuery({
        queryKey: campaignKeys.list(shopId, filters),
        queryFn: async () => {
            let query = supabase
                .from('ai_mass_campaigns')
                .select('*')
                .eq('shop_id', shopId)
                .order('created_at', { ascending: false })

            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }
            if (filters?.search) {
                query = query.ilike('name', `%${filters.search}%`)
            }

            const { data, error } = await query
            if (error) throw error
            return (data || []) as MassCampaign[]
        },
        enabled: !!shopId,
        staleTime: 30 * 1000, // 30 seconds
    })
}

// Hook: Single campaign
export function useCampaign(campaignId: string | undefined) {
    return useQuery({
        queryKey: campaignKeys.detail(campaignId || ''),
        queryFn: async () => {
            if (!campaignId) return null

            const { data, error } = await supabase
                .from('ai_mass_campaigns')
                .select('*')
                .eq('id', campaignId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') return null
                throw error
            }
            return data as MassCampaign
        },
        enabled: !!campaignId,
    })
}

// Hook: Campaign stats
export function useCampaignStats(shopId: string) {
    return useQuery({
        queryKey: campaignKeys.stats(shopId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_mass_campaigns')
                .select('status')
                .eq('shop_id', shopId)

            if (error) throw error

            const stats: CampaignStats = {
                total: data?.length || 0,
                draft: 0,
                scheduled: 0,
                in_progress: 0,
                completed: 0,
                failed: 0,
                cancelled: 0
            }

            data?.forEach(campaign => {
                if (campaign.status) {
                    stats[campaign.status as keyof Omit<CampaignStats, 'total'>]++
                }
            })

            return stats
        },
        enabled: !!shopId,
        staleTime: 60 * 1000, // 1 minute
    })
}

// Hook: Create campaign
export function useCampaignCreate() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: MassCampaignCreateData): Promise<MassCampaign> => {
            const { data: campaign, error } = await supabase
                .from('ai_mass_campaigns')
                .insert({
                    shop_id: data.shop_id,
                    name: data.name,
                    message: data.message,
                    customer_segment: data.customer_segment ?? {},
                    scheduled_send_at: data.scheduled_send_at ?? null,
                    status: data.status ?? 'draft',
                    total_recipients: 0,
                    sent_count: 0,
                    failed_count: 0,
                    created_by: data.created_by ?? null
                })
                .select()
                .single()

            if (error) throw error
            return campaign
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list(data.shop_id) })
            queryClient.invalidateQueries({ queryKey: campaignKeys.stats(data.shop_id) })
            toast.success('Campaign created successfully')
        },
        onError: (error: Error) => {
            toast.error(`Failed to create campaign: ${error.message}`)
        }
    })
}

// Hook: Update campaign
export function useCampaignUpdate() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: MassCampaignUpdateData }): Promise<MassCampaign> => {
            const { data: campaign, error } = await supabase
                .from('ai_mass_campaigns')
                .update(data)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return campaign
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list(data.shop_id) })
            queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) })
            queryClient.invalidateQueries({ queryKey: campaignKeys.stats(data.shop_id) })
            toast.success('Campaign updated successfully')
        },
        onError: (error: Error) => {
            toast.error(`Failed to update campaign: ${error.message}`)
        }
    })
}

// Hook: Delete campaign
export function useCampaignDelete() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, shopId }: { id: string; shopId: string }) => {
            const { error } = await supabase
                .from('ai_mass_campaigns')
                .delete()
                .eq('id', id)

            if (error) throw error
            return { id, shopId }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list(data.shopId) })
            queryClient.invalidateQueries({ queryKey: campaignKeys.stats(data.shopId) })
            toast.success('Campaign deleted successfully')
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete campaign: ${error.message}`)
        }
    })
}

// Hook: Send campaign
export function useCampaignSend() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (campaignId: string) => {
            const response = await fetch(`/api/messaging/campaigns/${campaignId}/send`, {
                method: 'POST'
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Failed to send campaign')
            }

            return data
        },
        onSuccess: (data, campaignId) => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) })
            queryClient.invalidateQueries({ queryKey: campaignKeys.lists() })
            // Invalidate all campaign queries to refresh stats
            queryClient.invalidateQueries({ queryKey: campaignKeys.all })
            toast.success(data.message || `Campaign sent to ${data.total_recipients || 0} recipients`)
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to send campaign')
        }
    })
}

