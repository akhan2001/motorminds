'use client'

import { useChat } from 'ai/react'
import type { Message } from 'ai'
import { ChangeEvent, useState, useEffect } from 'react'

import { Nav } from "../components/nav"
import { MiaOnboarding } from "../components/ui/MiaDiagnosticChat/MiaOnboarding"
import { MiaDiagnosticsHeader } from "../components/ui/MiaDiagnosticChat/MiaDiagnosticsHeader"
import { DiagnosticChatForm } from "../components/ui/MiaDiagnosticChat/MiaDiagnosticsChatForm"
import { DiagnosticMessage } from "../components/ui/MiaDiagnosticChat/MiaDiagnostics.types"
import { Conversation, ConversationContent, ConversationScrollButton } from "../components/ui/MiaDiagnosticChat/elements/Conversations"
import DiagnosticMessageCard from "./components/DiagnosticMessageCard"
import ThinkingIndicator from "./components/ThinkingIndicator"
import { AlertTriangle } from "lucide-react"

export default function MiaPage() {
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [sessionLoading, setSessionLoading] = useState(true)

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | undefined>()

    // Initialize session on component mount
    useEffect(() => {
        // Check if there's an existing session in localStorage
        const existingSessionId = localStorage.getItem('mia-session-id')
        if (existingSessionId) {
            loadExistingSession(existingSessionId)
        } else {
            initializeSession()
        }
    }, [])

    const loadExistingSession = async (sessionId: string) => {
        try {
            setSessionLoading(true)
            
            // Try to get the existing session from the API
            const sessionResponse = await fetch(`/api/mia/session?sessionId=${sessionId}`, {
                method: 'GET'
            })
            
            if (!sessionResponse.ok) {
                throw new Error('Session not found')
            }
            
            const { session } = await sessionResponse.json()
            setCurrentSessionId(session.session_id)
            
            // Update localStorage with the actual session ID (in case it was replaced)
            localStorage.setItem('mia-session-id', session.session_id)
            
            // Load existing messages for this session
            await loadSessionMessages(session.session_id)
            
        } catch (err) {
            console.error('Failed to load existing session:', err)
            // If loading existing session fails, create a new one
            await initializeSession()
        } finally {
            setSessionLoading(false)
        }
    }

    const initializeSession = async () => {
        try {
            setSessionLoading(true)
            
            // Create new session
            const sessionResponse = await fetch('/api/mia/session', {
                method: 'GET'
            })
            
            if (!sessionResponse.ok) {
                const errorText = await sessionResponse.text()
                console.error('Session creation failed:', {
                    status: sessionResponse.status,
                    statusText: sessionResponse.statusText,
                    error: errorText
                })
                throw new Error(`Failed to create session: ${sessionResponse.status} - ${errorText}`)
            }
            
            const { session } = await sessionResponse.json()
            setCurrentSessionId(session.session_id)
            
            // Store session ID in localStorage for persistence
            localStorage.setItem('mia-session-id', session.session_id)
            
            // Load existing messages for this session
            await loadSessionMessages(session.session_id)
            
        } catch (err) {
            console.error('Failed to initialize session:', err)
            setError(err as Error)
        } finally {
            setSessionLoading(false)
        }
    }

    const loadSessionMessages = async (sessionId: string) => {
        try {
            const messagesResponse = await fetch(`/api/mia/messages?sessionId=${sessionId}`)
            
            if (messagesResponse.ok) {
                const { messages: dbMessages } = await messagesResponse.json()
                
                // Convert database messages to UI message format
                const uiMessages: Message[] = dbMessages.map((msg: any) => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    metadata: msg.metadata
                }))
                
                setMessages(uiMessages)
            }
        } catch (err) {
            console.error('Failed to load session messages:', err)
        }
    }

    // Handle message submission with session persistence
    const handleSubmit = async (message: string) => {
        if (!message.trim() || !currentSessionId) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: message
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)
        setError(undefined)

        try {
            const response = await fetch('/api/mia-diagnostics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    vehicleInfo: {},
                    sessionId: currentSessionId
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API Error: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            console.log('API Response:', data)

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.content || data.fullResponse?.choices?.[0]?.message?.content || 'No response received',
                metadata: {
                    citations: data.citations,
                    searchResults: data.searchResults,
                    diagnosticMode: 'basic'
                }
            }

            setMessages(prev => [...prev, assistantMessage])

        } catch (err) {
            console.error('Chat Error:', err)
            setError(err as Error)
            
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const stop = () => {
        setIsLoading(false)
    }

    const reload = async () => {
        // Implement reload if needed
        return null
    }


    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
    }

    const handlePromptSelect = (prompt: string) => {
        setInput(prompt)
        // Focus the textarea after setting the value
        setTimeout(() => {
            const textarea = document.querySelector('textarea')
            textarea?.focus()
        }, 100)
    }

    const handleClearMessages = async () => {
        setMessages([])
        setEditingMessageId(null)
        
        // Clear the stored session ID
        localStorage.removeItem('mia-session-id')
        
        // Create a new session
        await initializeSession()
    }

    const handleCloseAssistant = () => {
        // Just clear the current session without creating a new one
        setMessages([])
        setEditingMessageId(null)
        setCurrentSessionId(null)
        localStorage.removeItem('mia-session-id')
    }


    const handleCancelEdit = () => {
        setEditingMessageId(null)
        setInput('')
    }

    const hasMessages = messages.length > 0

    // Show loading screen while session is initializing
    if (sessionLoading) {
        return (
            <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Initializing MIA session...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Show error screen if session failed to initialize
    if (error && !currentSessionId) {
        return (
            <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
                <Nav />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="text-red-600 mb-4">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                            <h2 className="text-lg font-semibold text-foreground">Session Error</h2>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                            {error.message}
                        </p>
                        <button 
                            onClick={() => {
                                setError(undefined)
                                initializeSession()
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
            <Nav />

            {/* Header controls */}
            <div className="px-4 py-3 border-b border-border bg-slate-50 dark:bg-card">
                <MiaDiagnosticsHeader
                    isChatLoading={isLoading}
                    onClearMessages={handleClearMessages}
                    onCloseAssistant={handleCloseAssistant}
                />
            </div>

                        {/* Chat content area - full width */}
                        <div className="flex-1 min-h-0 flex flex-col">
                            {/* Chat Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto">
                                {hasMessages ? (
                                    <Conversation className="h-full">
                                        <ConversationContent className="max-w-4xl mx-auto p-4">
                                            {messages.map((message: Message, index: number) => (
                                                <DiagnosticMessageCard
                                                    key={message.id}
                                                    message={message}
                                                    isLoading={isLoading && index === messages.length - 1}
                                                />
                                            ))}
                                            
                                            {/* Show thinking indicator when loading */}
                                            {isLoading && (
                                                <ThinkingIndicator 
                                                    message="MIA is analyzing your diagnostic request and searching for relevant information..."
                                                />
                                            )}
                                            
                                            {error && (
                                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 rounded-lg">
                                                    <p className="text-red-600 dark:text-red-400 text-sm">
                                                        <strong>Error:</strong> {error.message}
                                                    </p>
                                                    <button
                                                        onClick={() => reload()}
                                                        className="mt-2 text-xs text-red-600 dark:text-red-300 hover:text-red-700 dark:hover:text-red-200 underline"
                                                    >
                                                        Try again
                                                    </button>
                                                </div>
                                            )}
                                        </ConversationContent>
                                        <ConversationScrollButton />
                                    </Conversation>
                                ) : (
                                    /* Onboarding View */
                                    <div className="h-full flex items-center justify-center p-4">
                                        <div className="w-full max-w-4xl">
                                            <MiaOnboarding
                                                onValueChange={handlePromptSelect}
                                                onFocusInput={() => {
                                                    const textarea = document.querySelector('textarea')
                                                    textarea?.focus()
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input Form - Fixed at bottom */}
                            <div className="border-t border-border p-4 bg-slate-50 dark:bg-card">
                                <div className="max-w-4xl mx-auto">
                                    <DiagnosticChatForm
                                        loading={isLoading}
                                        value={input}
                                        onValueChange={handleInputChange}
                                        onSubmit={handleSubmit}
                                        onStop={stop}
                                        isEditing={editingMessageId !== null}
                                    />
                                    
                                    {/* Disclaimer Footer */}
                                    <div className="mt-3 text-center">
                                        <p className="text-xs text-muted-foreground">
											MIA may not be perfect. Please verify important information.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
        </div>
    )
}