'use client'

import { User, ExternalLink, Image } from 'lucide-react'
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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect()}
            className={cn(
                'rounded-lg cursor-pointer transition-colors p-2.5 border border-transparent',
                isSelected
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                    : 'hover:bg-muted/60'
            )}
            onClick={onSelect}
        >
            <div className="flex items-start gap-2 min-w-0">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                        {hasCustomer ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onCustomerClick?.(conversation.customer_id!)
                                }}
                                className="text-foreground font-medium truncate text-left inline-flex items-center gap-1 hover:text-red-600"
                            >
                                <span className="truncate">{displayName}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-60" />
                            </button>
                        ) : (
                            <span className="text-foreground font-medium truncate block">{displayName}</span>
                        )}
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                            {formatTime(conversation.last_message_at)}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {recentMessage?.direction === 'outbound' && 'You: '}
                        {recentMessage?.media_count && recentMessage.media_count > 0 && (
                            <Image className="h-3 w-3 inline mr-0.5 align-middle" />
                        )}
                        {recentMessage?.message_body || (recentMessage?.media_count ? 'Media' : 'No messages')}
                    </p>
                </div>
            </div>
        </div>
    )
}
