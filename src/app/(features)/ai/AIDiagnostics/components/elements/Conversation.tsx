"use client"

import React, { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'
import { StickToBottom, useStickToBottomContext } from './StickToBottom'

interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export const Conversation = ({ className, ...props }: ConversationProps) => (
    <StickToBottom
        className={cn('relative flex-1 overflow-y-auto', className)}
        initial="smooth"
        resize="smooth"
        role="log"
        {...props}
    />
)

interface ConversationContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export const ConversationContent = ({ className, ...props }: ConversationContentProps) => (
    <StickToBottom.Content className={cn('p-4', className)} {...props} />
)

interface ConversationScrollButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string
}

export const ConversationScrollButton = ({ className, ...props }: ConversationScrollButtonProps) => {
    const { isAtBottom, scrollToBottom } = useStickToBottomContext()
    
    const handleScrollToBottom = useCallback(() => {
        scrollToBottom()
    }, [scrollToBottom])

    return (
        !isAtBottom && (
            <div className="sticky bottom-4 flex justify-center pointer-events-none">
                <Button
                    className={cn(
                        'rounded-full pointer-events-auto',
                        'bg-[#1f1f1f] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]',
                        'shadow-lg z-10',
                        className
                    )}
                    onClick={handleScrollToBottom}
                    size="sm"
                    variant="outline"
                    {...props}
                >
                    <ArrowDown className="w-4 h-4" />
                </Button>
            </div>
        )
    )
}
