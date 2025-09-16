import { useState, useEffect, useCallback, useRef } from 'react'

export interface ChatMessage {
    id: string
    role: 'user' | 'mia'
    content: string
    products?: MiaProduct[]
    sources?: Source[]
    timestamp: Date
}

export interface MiaProduct {
    partName: string
    partNumber: string
    compatible: string
    price: string
    supplier?: string
    availability?: string
    link?: string
}

export interface Source {
    title: string
    url: string
    description: string
}

export const useChat = () => {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState('')
    const [chatLoading, setChatLoading] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [sessionInitialized, setSessionInitialized] = useState(false)
    const chatScrollRef = useRef<HTMLDivElement>(null)

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
        }
    }, [chatMessages])

    const initializeSession = useCallback(async (skipHistory = false) => {
        try {
            // Get or create session
            const response = await fetch('/api/mia/session')
            const data = await response.json()
            
            if (data.session) {
                setSessionId(data.session.session_id)
                
                if (!skipHistory) {
                    // Load message history
                    const messagesResponse = await fetch(`/api/mia/messages?sessionId=${data.session.session_id}`)
                    const messagesData = await messagesResponse.json()
                    
                    if (messagesData.messages && messagesData.messages.length > 0) {
                        // Convert stored messages to chat messages format
                        const convertedMessages = messagesData.messages.map((msg: any) => ({
                            id: msg.id,
                            role: msg.role === 'assistant' ? 'mia' : msg.role,
                            content: msg.content,
                            products: msg.metadata?.parts || [],
                            sources: msg.metadata?.sources || [],
                            timestamp: new Date(msg.created_at)
                        }))
                        setChatMessages(convertedMessages)
                    } else {
                        // No message history, show welcome message
                        setChatMessages([{
                            id: '1',
                            role: 'mia',
                            content: "Hi! I'm Mia, your AI parts advisor. I can help you find the right parts for your vehicle. Just describe what you need!",
                            timestamp: new Date()
                        }])
                    }
                } else {
                    // Skip history and show fresh welcome message
                    setChatMessages([{
                        id: '1',
                        role: 'mia',
                        content: "Hi! I'm Mia, your AI parts advisor. I can help you find the right parts for your vehicle. Just describe what you need!",
                        timestamp: new Date()
                    }])
                }
            }
            setSessionInitialized(true)
        } catch (error) {
            console.error('Failed to initialize session:', error)
            // Fallback to local welcome message
            setChatMessages([{
                id: '1',
                role: 'mia',
                content: "Hi! I'm Mia, your AI parts advisor. I can help you find the right parts for your vehicle. Just describe what you need!",
                timestamp: new Date()
            }])
            setSessionInitialized(true)
        }
    }, [])

    const updateSessionContext = useCallback(async (vehicleContext: any) => {
        if (!sessionId) return
        
        try {
            await fetch('/api/mia/session', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, vehicleContext })
            })
        } catch (error) {
            console.error('Failed to update session context:', error)
        }
    }, [sessionId])

    const sendChatMessage = useCallback(async (vehicleContext?: any) => {
        if (!chatInput.trim() || chatLoading || !sessionId) return

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput.trim(),
            timestamp: new Date()
        }

        setChatMessages(prev => [...prev, userMessage])
        setChatInput('')
        setChatLoading(true)

        try {
            const response = await fetch('/api/mia', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    vehicleContext,
                    sessionId
                })
            })

            const data = await response.json()

            if (data.success) {
                const miaMessage: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'mia',
                    content: data.message,
                    products: data.products || [],
                    sources: data.sources || [],
                    timestamp: new Date()
                }

                setChatMessages(prev => [...prev, miaMessage])
            } else {
                throw new Error(data.error || 'Failed to get response')
            }
        } catch (error) {
            console.error('Chat error:', error)
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'mia',
                content: "I'm sorry, I'm having trouble processing your request. Please try again.",
                timestamp: new Date()
            }
            setChatMessages(prev => [...prev, errorMessage])
        } finally {
            setChatLoading(false)
        }
    }, [chatInput, chatLoading, sessionId])

    const clearChatSession = useCallback(async () => {
        if (!sessionId) return
        
        try {
            const response = await fetch(`/api/mia/session?sessionId=${sessionId}`, {
                method: 'DELETE'
            })
            
            // Reset local state
            setSessionId(null)
            setSessionInitialized(false)
            setChatMessages([])
            
            // Reinitialize session (skip loading old history)
            await initializeSession(true)
        } catch (error) {
            console.error('Failed to clear session:', error)
        }
    }, [sessionId, initializeSession])

    // Initialize chat session on mount
    useEffect(() => {
        initializeSession()
    }, [initializeSession])

    return {
        chatMessages,
        chatInput,
        setChatInput,
        chatLoading,
        sessionId,
        sessionInitialized,
        chatScrollRef,
        sendChatMessage,
        clearChatSession,
        updateSessionContext,
        initializeSession
    }
}
