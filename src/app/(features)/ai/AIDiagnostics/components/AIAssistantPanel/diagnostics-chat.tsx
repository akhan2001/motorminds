"use client"

import type { Message } from 'ai'
import type { UseChatHelpers } from '@ai-sdk/react'
import { MessageDisplay } from '../Message/message-display'
import { MessageLoading } from '../Message/message-loading'
import { cn } from '@/lib/utils'
import { Conversation, ConversationContent, ConversationScrollButton } from '../elements/Conversation'

interface DiagnosticsChatProps {
    chatInstance: UseChatHelpers<any>
    className?: string
}

/**
 * Diagnostics Chat Component
 * 
 * Displays chat messages between user and MIA assistant.
 * Uses Supabase Conversation pattern with stick-to-bottom behavior and scroll button.
 * 
 * @component
 */
export function DiagnosticsChat({ chatInstance, className }: DiagnosticsChatProps) {
    const { messages, status } = chatInstance
    const isLoading = status === 'loading' || status === 'streaming'

    return (
        <Conversation className={cn('h-full', className)}>
            <ConversationContent className="w-full pb-24">
                {messages.map((message: Message) => (
                    <MessageDisplay 
                        key={message.id} 
                        message={message}
                    />
                ))}
                
                {/* Loading indicator while AI is processing */}
                {isLoading && <MessageLoading />}
            </ConversationContent>
            
            {/* Floating scroll to bottom button */}
            <ConversationScrollButton />
        </Conversation>
    )
}
