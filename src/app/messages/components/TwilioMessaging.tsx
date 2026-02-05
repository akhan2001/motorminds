'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Phone } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/feedback/loading-states'

// Feature hooks
import { useSmsConversations, useSmsConversationsRealtime } from '@/app/(features)/messaging/hooks/use-sms-conversations'
import { useTwilioPhoneNumbers } from '@/app/(features)/messaging/hooks/use-twilio-phone-numbers'

// Feature components
import { ConversationList, ChatArea } from '@/app/(features)/messaging/sms/components'
import type { SmsCustomer, SmsConversation } from '@/app/(features)/messaging/types/sms'

interface TwilioMessagingProps {
    shopId: string
}

export default function TwilioMessaging({ shopId }: TwilioMessagingProps) {
    const router = useRouter()
    const [selectedPhone, setSelectedPhone] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState<SmsCustomer | null>(null)

    // Data fetching with React Query
    const {
        data: conversations = [],
        isLoading: isLoadingConversations,
        refetch: refetchConversations,
    } = useSmsConversations(shopId)

    const {
        data: phoneNumbers = [],
        isLoading: isLoadingPhoneNumbers,
    } = useTwilioPhoneNumbers(shopId)

    // Real-time subscriptions
    useSmsConversationsRealtime(shopId)

    // Update selected customer when phone or conversations change
    useEffect(() => {
        if (selectedPhone) {
            const conversation = conversations.find(
                (c: SmsConversation) => c.customer_phone === selectedPhone
            )
            setSelectedCustomer(conversation?.customer || null)
        } else {
            setSelectedCustomer(null)
        }
    }, [selectedPhone, conversations])

    // Navigation
    const handleCustomerClick = (customerId: string) => {
        router.push(`/customers/${customerId}`)
    }

    const handleConversationSelect = (phone: string) => {
        setSelectedPhone(phone)
    }

    const handleRefresh = () => {
        refetchConversations()
    }

    // Loading state
    if (isLoadingPhoneNumbers || isLoadingConversations) {
        return (
            <Card className="bg-slate-50 dark:bg-card border-border">
                <CardContent className="p-6 text-center">
                    <LoadingSpinner size="md" className="mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading messaging...</p>
                </CardContent>
            </Card>
        )
    }

    // No phone numbers state
    if (phoneNumbers.length === 0) {
        return (
            <Card className="bg-slate-50 dark:bg-card border-border">
                <CardContent className="p-6 text-center">
                    <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2 text-foreground">
                        No SMS Phone Numbers
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        You need to have a Twilio phone number assigned to start SMS messaging.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Contact your administrator to assign a SMS-enabled phone number to your shop.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full flex-1 min-h-0">
                <div className="lg:col-span-4 xl:col-span-3 min-h-0 flex flex-col">
                    <ConversationList
                        conversations={conversations}
                        selectedPhone={selectedPhone}
                        onSelectConversation={handleConversationSelect}
                        onRefresh={handleRefresh}
                        onCustomerClick={handleCustomerClick}
                        isLoading={isLoadingConversations}
                    />
                </div>
                <div className="lg:col-span-8 xl:col-span-9 min-h-0 flex flex-col">
                    <ChatArea
                        shopId={shopId}
                        selectedPhone={selectedPhone}
                        selectedCustomer={selectedCustomer}
                        conversations={conversations}
                        onCustomerClick={handleCustomerClick}
                    />
                </div>
            </div>
        </div>
    )
}
