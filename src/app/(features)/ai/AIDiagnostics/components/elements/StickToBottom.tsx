"use client"

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface StickToBottomContextType {
    isAtBottom: boolean
    scrollToBottom: () => void
}

const StickToBottomContext = createContext<StickToBottomContextType | null>(null)

export const useStickToBottomContext = () => {
    const context = useContext(StickToBottomContext)
    if (!context) {
        throw new Error('useStickToBottomContext must be used within StickToBottom')
    }
    return context
}

interface StickToBottomProps extends React.HTMLAttributes<HTMLDivElement> {
    initial?: 'smooth' | 'auto'
    resize?: 'smooth' | 'auto'
    children: React.ReactNode
}

export function StickToBottom({ 
    className, 
    initial = 'smooth', 
    resize = 'smooth',
    children,
    ...props 
}: StickToBottomProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isAtBottom, setIsAtBottom] = useState(true)
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        const container = containerRef.current
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior
            })
        }
    }, [])

    const checkIfAtBottom = useCallback(() => {
        const container = containerRef.current
        if (container) {
            const threshold = 50 // pixels from bottom
            const isNearBottom = 
                container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
            setIsAtBottom(isNearBottom)
            setShouldAutoScroll(isNearBottom)
        }
    }, [])

    // Handle scroll events
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleScroll = () => {
            checkIfAtBottom()
        }

        container.addEventListener('scroll', handleScroll, { passive: true })
        return () => container.removeEventListener('scroll', handleScroll)
    }, [checkIfAtBottom])

    // Auto-scroll on content changes when at bottom
    useEffect(() => {
        if (shouldAutoScroll) {
            scrollToBottom(resize)
        }
    }, [children, shouldAutoScroll, scrollToBottom, resize])

    // Initial scroll to bottom
    useEffect(() => {
        scrollToBottom(initial)
    }, [scrollToBottom, initial])

    const contextValue: StickToBottomContextType = {
        isAtBottom,
        scrollToBottom: () => scrollToBottom('smooth')
    }

    return (
        <StickToBottomContext.Provider value={contextValue}>
            <div
                ref={containerRef}
                className={cn('relative flex-1 overflow-y-auto', className)}
                role="log"
                {...props}
            >
                {children}
            </div>
        </StickToBottomContext.Provider>
    )
}

// Content wrapper component
interface StickToBottomContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

StickToBottom.Content = function StickToBottomContent({ 
    className, 
    children, 
    ...props 
}: StickToBottomContentProps) {
    return (
        <div className={cn('p-4', className)} {...props}>
            {children}
        </div>
    )
}
