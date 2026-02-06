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
        <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3 bg-card">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    {customer?.id ? (
                        <button
                            onClick={() => onCustomerClick?.(customer.id)}
                            className="text-foreground font-semibold hover:text-red-600 transition-colors inline-flex items-center gap-1 truncate max-w-[180px] sm:max-w-none"
                        >
                            <span className="truncate">{displayName}</span>
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                        </button>
                    ) : (
                        <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-none inline-block">
                            {displayName}
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground font-mono truncate">
                        {selectedPhone}
                    </span>
                </div>
                {(customer?.customer_email || customer?.license_plate) && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 truncate">
                        {customer.customer_email && (
                            <span className="inline-flex items-center gap-1 min-w-0 truncate max-w-[200px]">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{customer.customer_email}</span>
                            </span>
                        )}
                        {customer.license_plate && (
                            <span className="inline-flex items-center gap-1 flex-shrink-0">
                                <Car className="h-3 w-3" />
                                {customer.license_plate}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
