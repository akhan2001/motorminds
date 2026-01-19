'use client'

import { User, Mail, Car, Clock, ExternalLink, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SmsConversation } from '../../types/sms'

interface ConversationItemProps {
    conversation: SmsConversation
    isSelected: boolean
    onSelect: () => void
    onCustomerClick?: (customerId: string) => void
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Get display name for conversation
 */
function getDisplayName(conversation: SmsConversation): string {
    return (
        conversation.customer?.customer_name ||
        conversation.customer_name ||
        conversation.customer_phone
    )
}

export function ConversationItem({
    conversation,
    isSelected,
    onSelect,
    onCustomerClick,
}: ConversationItemProps) {
    const hasCustomer = !!conversation.customer_id
    const displayName = getDisplayName(conversation)
    const recentMessage = conversation.recent_message

    return (
        <div
            className={cn(
                'p-3 rounded-lg cursor-pointer transition-colors',
                isSelected
                    ? 'bg-muted border-l-4 border-l-red-600 border border-border'
                    : 'hover:bg-muted/50 hover:border-l-4 hover:border-l-red-300'
            )}
            onClick={onSelect}
        >
            {/* Header with name */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        {hasCustomer ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onCustomerClick?.(conversation.customer_id!)
                                }}
                                className="text-foreground font-medium truncate block hover:text-red-600 transition-colors text-left flex items-center gap-1"
                            >
                                {displayName}
                                <ExternalLink className="h-3 w-3 opacity-60" />
                            </button>
                        ) : (
                            <span className="text-foreground font-medium truncate block">
                                {displayName}
                            </span>
                        )}

                        {/* Customer email */}
                        {conversation.customer?.customer_email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {conversation.customer.customer_email}
                            </span>
                        )}

                        {/* License plate */}
                        {conversation.customer?.license_plate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {conversation.customer.license_plate}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent message preview */}
            <p className="text-sm text-muted-foreground truncate mb-1">
                {recentMessage?.direction === 'outbound' && 'You: '}
                {recentMessage?.media_count && recentMessage.media_count > 0 && (
                    <span className="inline-flex items-center gap-1 mr-1">
                        <Image className="h-3 w-3" />
                    </span>
                )}
                {recentMessage?.message_body ||
                    (recentMessage?.media_count ? 'Media attachment' : 'No messages yet')}
            </p>

            {/* Footer with phone and time */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    {conversation.customer_phone}
                </p>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(conversation.last_message_at)}
                </span>
            </div>
        </div>
    )
}
