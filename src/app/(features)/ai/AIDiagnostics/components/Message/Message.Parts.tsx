"use client"

import { cn } from '@/lib/utils'
import { MessageMarkdown } from './MessageMarkdown'

interface TextUIPart {
    text: string
}

interface MessagePartTextProps {
    textPart: TextUIPart
    isUserMessage?: boolean
    state?: 'editing' | 'normal'
}

/**
 * Message Parts Component
 * 
 * Handles rich styling for assistant text, tool status rows, and other message parts.
 * Follows Supabase pattern for consistent message part rendering.
 */
export function MessagePartText({ textPart, isUserMessage = false, state = 'normal' }: MessagePartTextProps) {
    return (
        <MessageMarkdown
            className={cn(
                'max-w-none space-y-4 prose prose-sm prose-li:mt-1 [&>div]:my-4',
                'prose-h1:text-xl prose-h1:mt-6 prose-h2:text-lg prose-h2:font-medium',
                'prose-h3:no-underline prose-h3:text-base prose-h3:mb-4',
                'prose-strong:font-medium prose-strong:text-white',
                'prose-ol:space-y-3 prose-ul:space-y-3 prose-li:my-0',
                'break-words [&>p:not(:last-child)]:!mb-2',
                '[&>*>p:first-child]:!mt-0 [&>*>p:last-child]:!mb-0',
                '[&>*>*>p:first-child]:!mt-0 [&>*>*>p:last-child]:!mb-0',
                isUserMessage && 'text-white [&>p]:font-medium',
                state === 'editing' && 'animate-pulse'
            )}
        >
            {textPart.text}
        </MessageMarkdown>
    )
}

// Tool status row component for future use
export function ToolStatusRow({ 
    toolName, 
    status, 
    className 
}: { 
    toolName: string
    status: 'running' | 'complete' | 'error'
    className?: string 
}) {
    const statusColors = {
        running: 'text-yellow-400',
        complete: 'text-green-400',
        error: 'text-red-400'
    }

    return (
        <div className={cn('flex items-center gap-2 text-sm py-2', className)}>
            <div className={cn('w-2 h-2 rounded-full', {
                'bg-yellow-400 animate-pulse': status === 'running',
                'bg-green-400': status === 'complete',
                'bg-red-400': status === 'error'
            })} />
            <span className={cn('font-medium', statusColors[status])}>
                {toolName}
            </span>
            <span className="text-gray-400 capitalize">
                {status}
            </span>
        </div>
    )
}

// Thinking indicator for future use
export function ThinkingRow({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-center gap-2 text-sm py-2 text-gray-400', className)}>
            <div className="flex gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="italic">Thinking...</span>
        </div>
    )
}
