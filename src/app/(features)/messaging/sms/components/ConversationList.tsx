'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
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
        <Card className="bg-card border border-border rounded-xl h-full flex flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0 py-3 px-4">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        Conversations
                    </CardTitle>
                    <Button
                        onClick={onRefresh}
                        size="sm"
                        variant="ghost"
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                    >
                        <RefreshCw className={cn('h-4 w-4 text-muted-foreground', isLoading && 'animate-spin')} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
                <div className="p-2 space-y-1">
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
                        <div className="text-center py-10 px-4">
                            <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                            <p className="text-sm text-muted-foreground">No conversations yet</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
