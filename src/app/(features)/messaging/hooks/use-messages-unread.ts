'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import type { SmsMessage } from '../types/sms'

const supabase = createClient()

// Query keys factory
export const unreadKeys = {
    all: ['messages-unread'] as const,
    status: (shopId: string) => [...unreadKeys.all, 'status', shopId] as const,
}

/**
 * Fetch unread status from API
 */
async function fetchUnreadStatus(): Promise<boolean> {
    const response = await fetch('/api/messages/unread')
    
    if (!response.ok) {
        throw new Error('Failed to fetch unread status')
    }
    
    const data = await response.json()
    return data.hasUnread ?? false
}

/**
 * Mark a conversation as read
 */
export async function markConversationAsRead(customerPhone: string): Promise<void> {
    const response = await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_phone: customerPhone }),
    })
    
    if (!response.ok) {
        throw new Error('Failed to mark conversation as read')
    }
}

/**
 * Hook: Check if shop has unread messages
 * 
 * - Fetches initial unread status from API
 * - Subscribes to real-time updates on sms_messages (INSERT inbound)
 * - Subscribes to real-time updates on sms_shop_read_state (UPDATE/INSERT)
 */
export function useMessagesUnread(shopId: string | null | undefined) {
    const queryClient = useQueryClient()
    const messagesChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const readStateChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    // Query for unread status
    const query = useQuery({
        queryKey: unreadKeys.status(shopId || ''),
        queryFn: fetchUnreadStatus,
        enabled: !!shopId,
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true,
    })

    // Real-time subscription for new inbound messages
    useEffect(() => {
        if (!shopId) return

        // Subscribe to new messages - when an inbound message arrives, set hasUnread = true
        messagesChannelRef.current = supabase
            .channel(`unread_messages_${shopId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sms_messages',
                    filter: `shop_id=eq.${shopId}`,
                },
                (payload) => {
                    const newMessage = payload.new as SmsMessage
                    
                    // If it's an inbound message, set hasUnread to true and show toast
                    if (newMessage.direction === 'inbound') {
                        queryClient.setQueryData<boolean>(
                            unreadKeys.status(shopId),
                            true
                        )
                        
                        // Show toast notification for new message
                        toast.info('New message received', {
                            description: newMessage.from_number,
                            action: {
                                label: 'View',
                                onClick: () => window.location.href = '/messages',
                            },
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            if (messagesChannelRef.current) {
                supabase.removeChannel(messagesChannelRef.current)
            }
        }
    }, [shopId, queryClient])

    // Real-time subscription for read state changes
    useEffect(() => {
        if (!shopId) return

        // Subscribe to read state changes - when read state is updated, refetch to check if still unread
        readStateChannelRef.current = supabase
            .channel(`unread_read_state_${shopId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'sms_shop_read_state',
                    filter: `shop_id=eq.${shopId}`,
                },
                () => {
                    // Refetch unread status when read state changes
                    // This handles the case where another tab marks messages as read
                    queryClient.invalidateQueries({
                        queryKey: unreadKeys.status(shopId),
                    })
                }
            )
            .subscribe()

        return () => {
            if (readStateChannelRef.current) {
                supabase.removeChannel(readStateChannelRef.current)
            }
        }
    }, [shopId, queryClient])

    return {
        hasUnread: query.data ?? false,
        isLoading: query.isLoading,
        refetch: query.refetch,
        // Helper to invalidate the query (useful after marking as read)
        invalidate: () => queryClient.invalidateQueries({ queryKey: unreadKeys.status(shopId || '') }),
    }
}

/**
 * Hook: Mark conversation as read and invalidate unread status
 */
export function useMarkAsRead(shopId: string | null | undefined) {
    const queryClient = useQueryClient()

    const markAsRead = async (customerPhone: string) => {
        try {
            await markConversationAsRead(customerPhone)
            
            // Invalidate the unread status query so nav updates
            if (shopId) {
                queryClient.invalidateQueries({
                    queryKey: unreadKeys.status(shopId),
                })
            }
        } catch (error) {
            console.error('Failed to mark as read:', error)
        }
    }

    return { markAsRead }
}
