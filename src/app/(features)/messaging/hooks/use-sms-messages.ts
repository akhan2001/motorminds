'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import type { SmsMessage, SendMessageRequest, SendMessageResponse } from '../types/sms'
import { conversationKeys } from './use-sms-conversations'

const supabase = createClient()

// Query keys factory
export const messageKeys = {
    all: ['sms-messages'] as const,
    list: (shopId: string, customerPhone: string) => 
        [...messageKeys.all, 'list', shopId, customerPhone] as const,
}

/**
 * Fetch messages for a customer phone number
 */
async function fetchMessages(shopId: string, customerPhone: string): Promise<SmsMessage[]> {
    // Generate phone variations for better matching
    const phoneVariations = generatePhoneVariations(customerPhone)
    const phoneConditions = phoneVariations
        .map(phone => `from_number.eq.${phone},to_number.eq.${phone}`)
        .join(',')

    const { data, error } = await supabase
        .from('sms_messages')
        .select(`
            *,
            customer:customers(
                id,
                customer_name,
                customer_email,
                customer_phone
            )
        `)
        .eq('shop_id', shopId)
        .or(phoneConditions)
        .order('created_at', { ascending: true })
        .limit(100)

    if (error) throw error
    return (data || []) as SmsMessage[]
}

/**
 * Generate phone number variations for matching
 */
function generatePhoneVariations(phone: string): string[] {
    const cleaned = phone.replace(/[^+0-9]/g, '')
    const normalized = cleaned.replace('+', '')
    const withoutCountryCode = normalized.startsWith('1') ? normalized.substring(1) : normalized
    const withPlusOne = '+1' + withoutCountryCode

    return [
        cleaned,
        normalized,
        '+' + normalized,
        withPlusOne,
        withoutCountryCode,
        '1' + withoutCountryCode,
    ].filter((v, i, arr) => arr.indexOf(v) === i)
}

/**
 * Hook: List messages for a customer phone
 */
export function useSmsMessages(shopId: string, customerPhone: string) {
    return useQuery({
        queryKey: messageKeys.list(shopId, customerPhone),
        queryFn: () => fetchMessages(shopId, customerPhone),
        enabled: !!shopId && !!customerPhone,
        staleTime: 10 * 1000, // 10 seconds
    })
}

/**
 * Hook: Send SMS/MMS message
 */
export function useSendSmsMessage(shopId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (request: SendMessageRequest): Promise<SendMessageResponse> => {
            const response = await fetch('/api/twilio/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message')
            }

            return {
                success: true,
                message: data.message,
                twilioSid: data.twilioSid,
                messageType: data.messageType,
            }
        },
        onSuccess: (data, variables) => {
            const messageType = data.messageType === 'mms' ? 'MMS' : 'SMS'
            toast.success(`${messageType} sent successfully`)
            
            // Invalidate messages for this phone
            queryClient.invalidateQueries({
                queryKey: messageKeys.list(shopId, variables.to),
            })
            
            // Invalidate conversations
            queryClient.invalidateQueries({
                queryKey: conversationKeys.list(shopId),
            })
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to send message')
        },
    })
}

/**
 * Hook: Real-time subscription for new messages
 */
export function useSmsMessagesRealtime(
    shopId: string, 
    customerPhone: string,
    onNewMessage?: (message: SmsMessage) => void
) {
    const queryClient = useQueryClient()
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

    useEffect(() => {
        if (!shopId) return

        channelRef.current = supabase
            .channel(`sms_messages_${shopId}`)
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

                    // Check if message is for the selected conversation
                    if (customerPhone && 
                        (newMessage.from_number === customerPhone || 
                         newMessage.to_number === customerPhone)) {
                        // Add to cache
                        queryClient.setQueryData<SmsMessage[]>(
                            messageKeys.list(shopId, customerPhone),
                            (old) => old ? [...old, newMessage] : [newMessage]
                        )
                    }

                    // Show notification for inbound messages
                    if (newMessage.direction === 'inbound') {
                        const mediaText = newMessage.media_count > 0
                            ? ` (${newMessage.media_count} attachment${newMessage.media_count > 1 ? 's' : ''})`
                            : ''
                        toast.success(`New message from ${newMessage.from_number}${mediaText}`)
                    }

                    // Invalidate conversations to update recent_message
                    queryClient.invalidateQueries({
                        queryKey: conversationKeys.list(shopId),
                    })

                    onNewMessage?.(newMessage)
                }
            )
            .subscribe()

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
            }
        }
    }, [shopId, customerPhone, queryClient, onNewMessage])
}
