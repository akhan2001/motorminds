"use client"

import { cn } from '@/lib/utils'
import type { Message } from 'ai'
import { MessageMarkdown } from './MessageMarkdown'
import { MessagePartText } from './Message.Parts'

interface MessageDisplayProps {
    message: Message
    onClick?: () => void
    className?: string
    state?: 'normal' | 'predecessor-editing' | 'editing'
    variant?: 'normal' | 'warning'
}

/**
 * Message Display Components
 * 
 * Follows Supabase structure for consistent message layout and styling.
 * Provides Container, MainArea, and TextMessage components.
 */

// Container component - outer wrapper for each message
function MessageDisplayContainer({
    children, 
    onClick, 
    className,
}: React.PropsWithChildren<{ onClick?: () => void; className?: string }>) {
    return (
        <div
            className={cn('group text-white text-sm first:mt-0', className)}
            onClick={onClick}
        >
            {children}
        </div>
    )
}

// Main area component - flex layout for avatar and content
function MessageDisplayMainArea({ 
    children, 
    className 
}: React.PropsWithChildren<{ className?: string }>) {
    return (
        <div className={cn('flex gap-4 w-auto overflow-hidden group', className)}>
            {children}
        </div>
    )
}

// Avatar component for user messages
function MessageDisplayAvatar({ 
    role,
    className 
}: { 
    role: 'user' | 'assistant'
    className?: string 
}) {
    if (role === 'user') {
        return (
            <div className={cn('w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0', className)}>
                <span className="text-white text-sm font-medium">U</span>
            </div>
        )
    }

    return (
        <div className={cn('w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0', className)}>
            <span className="text-white text-sm font-medium">M</span>
        </div>
    )
}

// Text message component - renders markdown content
function MessageDisplayTextMessage({ 
    id, 
    isLoading, 
    readOnly, 
    children,
    isUserMessage = false
}: {
    id?: string
    isLoading?: boolean
    readOnly?: boolean
    children: string
    isUserMessage?: boolean
}) {
    return (
        <MessageMarkdown
            id={id}
            isLoading={isLoading}
            readOnly={readOnly}
            className={cn(
                'prose prose-sm max-w-none break-words prose-h2:font-medium',
                isUserMessage && '[&>p]:font-medium'
            )}
        >
            {children}
        </MessageMarkdown>
    )
}

// Main export - complete message display
export function MessageDisplay({ 
    message, 
    onClick, 
    className, 
    state = 'normal',
    variant = 'normal'
}: MessageDisplayProps) {
    const isUser = message.role === 'user'

    return (
        <MessageDisplayContainer
            className={cn(
                'mt-6 text-white',
                variant === 'warning' && 'bg-warning-200',
                state === 'predecessor-editing' && 'opacity-50 transition-opacity cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            <MessageDisplayMainArea>
                <MessageDisplayAvatar role={message.role} />
                <div className="flex-1 min-w-0">
                    <MessageDisplayTextMessage
                        id={message.id}
                        isUserMessage={isUser}
                    >
                        {message.content}
                    </MessageDisplayTextMessage>
                </div>
            </MessageDisplayMainArea>
        </MessageDisplayContainer>
    )
}

// Export individual components for flexibility
export const MessageDisplayComponents = {
    Container: MessageDisplayContainer,
    MainArea: MessageDisplayMainArea,
    Avatar: MessageDisplayAvatar,
    TextMessage: MessageDisplayTextMessage,
}