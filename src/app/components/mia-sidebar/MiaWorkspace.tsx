'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, User, Bot, AlertCircle } from "lucide-react"
import { useChat } from 'ai/react'
import { useMiaSidebar } from '@/contexts/MiaSidebarContext'
import MiaSidebarTop from './MiaSidebarTop'
import Image from 'next/image'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    error?: boolean
}

interface MiaWorkspaceProps {
    className?: string
    currentPage?: string
    shopId?: string
}

export default function MiaWorkspace({ 
    className = "", 
    currentPage = 'invoices',
    shopId 
}: MiaWorkspaceProps) {
    const { currentPage: contextPage } = useMiaSidebar()
    const activePage = currentPage || contextPage
    
    // Use Vercel AI SDK for chat functionality
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        setMessages
    } = useChat({
        api: '/api/mia/invoices/agent',
        body: {
            context: {
                shop_id: shopId || undefined,
                current_page: activePage
            }
        },
        onError: (error: any) => {
            console.error('Chat error:', error)
        }
    })
    
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    
    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }
    
    useEffect(() => {
        scrollToBottom()
    }, [messages])
    
    // Initialize with a welcome message if no messages exist
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMessage = {
                id: 'welcome',
                role: 'assistant' as const,
                content: `Hello! I'm MIA, your automotive invoice assistant. I can see you're on the ${activePage} page. How can I help you today?

I can assist with:
• Creating new invoices
• Finding customer or vehicle information  
• Calculating pricing and totals
• Searching existing invoices
• Managing customer records

Just tell me what you need, and I'll walk you through it step by step.`,
                createdAt: new Date()
            }
            
            setMessages([welcomeMessage])
        }
    }, [activePage, messages.length, setMessages])
    
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!input.trim() || isLoading || !shopId) return
        handleSubmit(e)
    }
    
    const formatTimestamp = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(new Date(date))
    }
    
    return (
        <div className={`flex flex-col h-full bg-black ${className}`}>
            {/* Top Section with Tools and Context */}
            <MiaSidebarTop currentPage={activePage} />

            {/* Error Display */}
            {error && (
                <div className="mx-4 my-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Connection error. Please try again.</span>
                    </div>
                </div>
            )}
            
            {/* Messages Area */}
            <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
                <div className="space-y-4 py-4">
                    {messages.map((message: any) => (
                        <div key={message.id}>
                            {message.role === 'user' ? (
                                // User message - red bubble on the right
                                <div className="flex justify-end mb-4">
                                    <div className="bg-[#b22222] text-white rounded-lg px-4 py-2 max-w-[80%]">
                                        <div className="text-sm whitespace-pre-wrap">
                                            {message.content}
                                        </div>
                                        <div className="text-xs opacity-70 mt-1 text-right">
                                            {formatTimestamp(message.createdAt ? new Date(message.createdAt) : new Date())}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Assistant message - full width, no background
                                <div className="w-full mb-4">
                                    <div className="flex items-start gap-3 mb-2">
                                        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                                            <Image
                                                src="/red-motorminds-logo-svg.svg"
                                                alt="Mia AI"
                                                width={16}
                                                height={16}
                                                className="w-4 h-4"
                                            />
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            MIA • {formatTimestamp(message.createdAt ? new Date(message.createdAt) : new Date())}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed pl-10">
                                        {message.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="w-full mb-4">
                            <div className="flex items-start gap-3 mb-2">
                                <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                                    <Image
                                        src="/red-motorminds-logo-svg.svg"
                                        alt="Mia AI"
                                        width={16}
                                        height={16}
                                        className="w-4 h-4"
                                    />
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    MIA • now
                                </div>
                            </div>
                            <div className="text-sm text-gray-100 pl-10 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>MIA is thinking...</span>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <Separator className="bg-[#2a2a2a]" />
            
            {/* Input Area */}
            <div className="p-4">
                <form onSubmit={handleFormSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder={
                            !shopId 
                                ? "Loading shop information..."
                                : activePage === 'invoices' 
                                ? "Ask me to create an invoice, find a customer, or help with pricing..."
                                : "How can I help you today?"
                        }
                        disabled={isLoading || !shopId}
                        className="flex-1 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#b22222] focus:ring-[#b22222]/20"
                        maxLength={500}
                        autoComplete="off"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                if (input.trim() && !isLoading && shopId) {
                                    handleFormSubmit(e as any)
                                }
                            }
                        }}
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!input.trim() || isLoading || !shopId}
                        className="bg-[#b22222] hover:bg-[#b22222]/80 text-white px-3"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </form>
                
                {/* Input Helper */}
                <div className="mt-2 text-xs text-gray-500">
                    Mia AI is still in beta. Please be patient with the responses.
                </div>
            </div>
        </div>
    )
}
