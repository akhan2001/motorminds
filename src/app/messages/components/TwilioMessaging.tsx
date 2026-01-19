'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageCircle, Plus, Phone } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/feedback/loading-states'

// Feature hooks
import { useSmsConversations, useSmsConversationsRealtime } from '@/app/(features)/messaging/hooks/use-sms-conversations'
import { useTwilioPhoneNumbers } from '@/app/(features)/messaging/hooks/use-twilio-phone-numbers'

// Feature components
import { ConversationList, ChatArea } from '@/app/(features)/messaging/sms/components'
import type { SmsCustomer, SmsConversation } from '@/app/(features)/messaging/types/sms'

// Local component
import SendNewMessage from './SendNewMessage'

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
        <div className="space-y-6">
            <Tabs defaultValue="conversations" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-50 dark:bg-muted">
                    <TabsTrigger
                        value="conversations"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-red-600 hover:bg-muted"
                    >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Conversations
                    </TabsTrigger>
                    <TabsTrigger
                        value="compose"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-red-600 hover:bg-muted"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Message
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="conversations" className="mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[400px] max-h-[700px]">
                        {/* Conversations List */}
                        <div className="lg:col-span-1 h-full overflow-hidden">
                            <ConversationList
                                conversations={conversations}
                                selectedPhone={selectedPhone}
                                onSelectConversation={handleConversationSelect}
                                onRefresh={handleRefresh}
                                onCustomerClick={handleCustomerClick}
                                isLoading={isLoadingConversations}
                            />
                        </div>

                        {/* Chat Area */}
                        <div className="lg:col-span-2 h-full overflow-hidden">
                            <ChatArea
                                shopId={shopId}
                                selectedPhone={selectedPhone}
                                selectedCustomer={selectedCustomer}
                                conversations={conversations}
                                onCustomerClick={handleCustomerClick}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="compose" className="space-y-4">
                    <SendNewMessage onMessageSent={handleRefresh} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
