'use client'

import { Mail, Car, ExternalLink, User } from 'lucide-react'
import type { SmsCustomer, SmsConversation } from '../../types/sms'

interface ChatHeaderProps {
    selectedPhone: string
    customer: SmsCustomer | null
    conversations: SmsConversation[]
    onCustomerClick?: (customerId: string) => void
}

/**
 * Get display name for chat header
 */
function getDisplayName(
    customer: SmsCustomer | null,
    conversations: SmsConversation[],
    selectedPhone: string
): string {
    if (customer?.customer_name) {
        return customer.customer_name
    }
    
    const conversation = conversations.find(
        (c) => c.customer_phone === selectedPhone
    )
    
    return conversation?.customer_name || selectedPhone
}

export function ChatHeader({
    selectedPhone,
    customer,
    conversations,
    onCustomerClick,
}: ChatHeaderProps) {
    const displayName = getDisplayName(customer, conversations, selectedPhone)

    return (
        <div className="px-4 py-3 flex items-center gap-3">
            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-red-600" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {customer?.id ? (
                        <button
                            onClick={() => onCustomerClick?.(customer.id)}
                            className="text-foreground font-semibold hover:text-red-600 transition-colors flex items-center gap-1 truncate"
                        >
                            {displayName}
                            <ExternalLink className="h-3 w-3 opacity-60 flex-shrink-0" />
                        </button>
                    ) : (
                        <span className="text-foreground font-semibold truncate">
                            {displayName}
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                        {selectedPhone}
                    </span>
                </div>

                {/* Compact customer details - single line */}
                {customer && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {customer.customer_email && (
                            <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                {customer.customer_email}
                            </span>
                        )}
                        {customer.license_plate && (
                            <span className="flex items-center gap-1">
                                <Car className="h-3 w-3 flex-shrink-0" />
                                {customer.license_plate}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
