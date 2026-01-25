'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, RefreshCw } from 'lucide-react'
import { ConversationItem } from './ConversationItem'
import type { SmsConversation } from '../../types/sms'

interface ConversationListProps {
    conversations: SmsConversation[]
    selectedPhone: string
    onSelectConversation: (phone: string) => void
    onRefresh: () => void
    onCustomerClick?: (customerId: string) => void
    isLoading?: boolean
}

export function ConversationList({
    conversations,
    selectedPhone,
    onSelectConversation,
    onRefresh,
    onCustomerClick,
    isLoading = false,
}: ConversationListProps) {
    return (
        <Card className="bg-slate-50 dark:bg-card border-border h-full flex flex-col">
            <CardHeader className="flex-shrink-0 pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Conversations
                    </CardTitle>
                    <Button
                        onClick={onRefresh}
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        className="text-xs border-red-300 text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950/20"
                    >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="space-y-1 p-4">
                        {conversations.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isSelected={selectedPhone === conversation.customer_phone}
                                onSelect={() => onSelectConversation(conversation.customer_phone)}
                                onCustomerClick={onCustomerClick}
                            />
                        ))}

                        {conversations.length === 0 && (
                            <div className="text-center py-8">
                                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-muted-foreground text-sm">
                                    No conversations yet
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
