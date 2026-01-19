'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { SmsConversation, RecentMessage } from '../types/sms'

const supabase = createClient()

// Query keys factory
export const conversationKeys = {
    all: ['sms-conversations'] as const,
    list: (shopId: string) => [...conversationKeys.all, 'list', shopId] as const,
}

/**
 * Fetch conversations with recent message
 */
async function fetchConversations(shopId: string): Promise<SmsConversation[]> {
    const { data: conversations, error } = await supabase
        .from('sms_conversations')
        .select(`
            *,
            customer:customers(
                id,
                customer_name,
                customer_email,
                customer_phone,
                customer_address,
                customer_vehicle,
                license_plate,
                notes,
                tags
            )
        `)
        .eq('shop_id', shopId)
        .order('last_message_at', { ascending: false })

    if (error) throw error

    // Get the most recent message for each conversation
    const conversationsWithMessages = await Promise.all(
        (conversations || []).map(async (conversation) => {
            const { data: recentMessage } = await supabase
                .from('sms_messages')
                .select('message_body, created_at, direction, media_count, message_type')
                .eq('shop_id', shopId)
                .or(`from_number.eq.${conversation.customer_phone},to_number.eq.${conversation.customer_phone}`)
                .order('created_at', { ascending: false })
                .limit(1)

            return {
                ...conversation,
                recent_message: (recentMessage?.[0] as RecentMessage) || null,
            }
        })
    )

    return conversationsWithMessages as SmsConversation[]
}

/**
 * Hook: List all SMS conversations for a shop
 */
export function useSmsConversations(shopId: string) {
    return useQuery({
        queryKey: conversationKeys.list(shopId),
        queryFn: () => fetchConversations(shopId),
        enabled: !!shopId,
        staleTime: 30 * 1000, // 30 seconds
    })
}

/**
 * Hook: Real-time subscription for conversation updates
 */
export function useSmsConversationsRealtime(shopId: string) {
    const queryClient = useQueryClient()
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    useEffect(() => {
        if (!shopId) return

        // Subscribe to conversation changes
        channelRef.current = supabase
            .channel(`sms_conversations_${shopId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'sms_conversations',
                    filter: `shop_id=eq.${shopId}`,
                },
                () => {
                    // Invalidate and refetch conversations
                    queryClient.invalidateQueries({ 
                        queryKey: conversationKeys.list(shopId) 
                    })
                }
            )
            .subscribe()

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
        }
    }, [shopId, queryClient])
}
