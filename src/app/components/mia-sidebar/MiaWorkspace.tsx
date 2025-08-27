'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Send, Loader2, User, Bot, AlertCircle, ArrowUp } from "lucide-react"
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
    
    // Determine which API to use based on current page
    const getApiEndpoint = (page: string) => {
        switch (page) {
            case 'invoices':
                return '/api/mia/invoices/agent'
            case 'customers':
                return '/api/mia/customers/agent'
            case 'appointments':
                return '/api/mia/appointments/agent'
            case 'inventory':
                return '/api/mia/inventory/agent'
            case 'loyalty':
                return '/api/mia/loyalty/agent'
            default:
                return '/api/mia/general/agent' // General assistant for other pages
        }
    }

    // Use Vercel AI SDK for chat functionality
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
        setMessages,
        append
    } = useChat({
        api: getApiEndpoint(activePage || 'general'),
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
    
    // Get general welcome message
    const getWelcomeMessage = (page: string) => {
        return `Hello! I'm MIA (MotorMinds Intelligent Assistant), your automotive shop AI assistant.

I can assist with various aspects of automotive shop management:
• **Invoice Management**: Creating, editing, and sending invoices
• **Customer Management**: Finding and managing customer information
• **Appointment Scheduling**: Managing your calendar and bookings
• **Inventory Tracking**: Parts and stock management
• **General Operations**: Guidance on daily shop operations

Just tell me what you need, and I'll walk you through it step by step.`
    }

    // Initialize with a welcome message if no messages exist
    useEffect(() => {
        if (messages.length === 0) {
            const welcomeMessage = {
                id: 'welcome',
                role: 'assistant' as const,
                content: getWelcomeMessage(activePage || 'general'),
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

    // Function to send a message programmatically (for quick actions)
    const sendMessage = (message: string) => {
        if (!message.trim() || isLoading || !shopId) return
        
        // Use the append function from useChat to send message directly
        append({
            role: 'user',
            content: message
        })
    }
    
    const formatTimestamp = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(new Date(date))
    }

    // Get page-specific input placeholder
    const getInputPlaceholder = (page: string) => {
        switch (page) {
            case 'invoices':
                return "Ask me to create an invoice, send invoice INV-123, or help with pricing..."
            case 'customers':
                return "Ask me to find a customer, add new customer, or update contact info..."
            case 'appointments':
                return "Ask me to schedule an appointment, check availability, or manage bookings..."
            case 'inventory':
                return "Ask me to find parts, check stock levels, or help with ordering..."
            case 'loyalty':
                return "Ask me about loyalty programs, customer rewards, or retention strategies..."
            default:
                return "How can I help you with your automotive shop today?"
        }
    }

    // Simple markdown parser for bold text
    const renderMarkdown = (text: string) => {
        // Split text by **bold** patterns
        const parts = text.split(/(\*\*.*?\*\*)/g)
        
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                // Remove ** and make bold
                const boldText = part.slice(2, -2)
                return <strong key={index} className="font-semibold text-white">{boldText}</strong>
            }
            return part
        })
    }
    
    return (
        <div className={`flex flex-col h-full bg-black ${className}`}>
            {/* Top Section with Tools and Context */}
            <MiaSidebarTop 
                currentPage={activePage || 'general'} 
                onSendMessage={sendMessage}
                isLoading={isLoading}
            />

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
                                    <div className="bg-[#b22222]/60 text-white rounded-lg px-4 py-2 max-w-[80%]">
                                        <div className="text-sm whitespace-pre-wrap">
                                            {message.content}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Assistant message - full width, no background
                                <div className="w-full mb-4">
                                    <div className="flex items-start gap-3 mb-2">
                                        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                                            <Image
                                                src="/red-motorminds-logo-png.png"
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
                                    <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed pl-10">
                                        {renderMarkdown(message.content)}
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
                                : getInputPlaceholder(activePage || 'general')
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
                        className="bg-[#b22222] hover:bg-[#b22222]/80 text-white rounded-full border-[#b22222]"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <ArrowUp className="w-3 h-3" />
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
