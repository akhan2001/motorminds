'use client'

import { useChat } from 'ai/react'
import type { Message } from 'ai'
import { ChangeEvent, useState } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

import { Nav } from "../components/nav"
import { MiaOnboarding } from "../components/ui/MiaDiagnosticChat/MiaOnboarding"
import { MiaDiagnosticsHeader } from "../components/ui/MiaDiagnosticChat/MiaDiagnosticsHeader"
import { DiagnosticChatForm } from "../components/ui/MiaDiagnosticChat/MiaDiagnosticsChatForm"
import { MemoizedDiagnosticMessage } from "../components/ui/MiaDiagnosticChat/MiaDiagnosticsMessage"
import { VehicleInputData, DiagnosticMessage } from "../components/ui/MiaDiagnosticChat/MiaDiagnostics.types"
import { Conversation, ConversationContent, ConversationScrollButton } from "../components/ui/MiaDiagnosticChat/elements/Conversations"
import { VehicleInfoForm } from "../components/ui/MiaDiagnosticChat/VehicleInfoForm"

export default function MiaPage() {
    const [vehicleInfo, setVehicleInfo] = useState<VehicleInputData>({
        symptoms: ''
    })
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null)

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | undefined>()

    // Temporary manual chat handling for debugging
    const handleSubmit = async (message: string, vehicleData?: VehicleInputData) => {
        if (!message.trim()) return

        if (vehicleData) {
            setVehicleInfo(vehicleData)
        }

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
                    vehicleInfo: vehicleData || vehicleInfo
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
                // Add Perplexity data to the message for display
                diagnosticData: {
                    perplexityData: {
                        citations: data.citations,
                        searchResults: data.searchResults
                    }
                }
            } as any

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

    const handleClearMessages = () => {
        setMessages([])
        setEditingMessageId(null)
    }

    const handleCloseAssistant = () => {
        // Could navigate back or close modal - for now just clear
        handleClearMessages()
    }

    const handleMessageDelete = (messageId: string) => {
        setMessages((prev: Message[]) => prev.filter((msg: Message) => msg.id !== messageId))
    }

    const handleMessageEdit = (messageId: string) => {
        const message = messages.find((msg: Message) => msg.id === messageId)
        if (message && message.role === 'user') {
            setInput(message.content as string)
            setEditingMessageId(messageId)
            // Remove this message and all following messages
            const messageIndex = messages.findIndex((msg: Message) => msg.id === messageId)
            setMessages((prev: Message[]) => prev.slice(0, messageIndex))
        }
    }

    const handleCancelEdit = () => {
        setEditingMessageId(null)
        setInput('')
    }

    const hasMessages = messages.length > 0

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
            <Nav />

            {/* Header controls */}
            <div className="px-4 py-3 border-b border-[#1f1f1f]">
                <MiaDiagnosticsHeader
                    isChatLoading={isLoading}
                    onClearMessages={handleClearMessages}
                    onCloseAssistant={handleCloseAssistant}
                    vehicleInfo={vehicleInfo}
                />
            </div>

            {/* Resizable content area */}
            <ResizablePanelGroup
                direction="horizontal"
                className="flex-1 min-h-0"
            >
                {/* Main Chat Area */}
                <ResizablePanel defaultSize={75} minSize={50} className="min-h-0">
                    <div className="h-full flex flex-col">
                        {/* Chat Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto">
                            {hasMessages ? (
                                <Conversation className="h-full">
                                    <ConversationContent className="max-w-4xl mx-auto p-4">
                                        {messages.map((message: Message, index: number) => {
                                            const isAfterEdited = editingMessageId !== null && 
                                                messages.findIndex((msg: Message) => msg.id === editingMessageId) < index
                                            
                                            return (
                                                <MemoizedDiagnosticMessage
                                                    key={message.id}
                                                    id={message.id}
                                                    message={message as unknown as DiagnosticMessage}
                                                    isLoading={isLoading && index === messages.length - 1}
                                                    onDelete={handleMessageDelete}
                                                    onEdit={handleMessageEdit}
                                                    isAfterEditedMessage={isAfterEdited}
                                                    isBeingEdited={editingMessageId === message.id}
                                                    onCancelEdit={handleCancelEdit}
                                                />
                                            )
                                        })}
                                        
                                        {error && (
                                            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                                <p className="text-red-400 text-sm">
                                                    <strong>Error:</strong> {error.message}
                                                </p>
                                                <button
                                                    onClick={() => reload()}
                                                    className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
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
                        <div className="border-t border-[#444444] p-4 bg-black">
                            <div className="max-w-4xl mx-auto">
                                <DiagnosticChatForm
                                    loading={isLoading}
                                    value={input}
                                    onValueChange={handleInputChange}
                                    onSubmit={handleSubmit}
                                    onStop={stop}
                                    isEditing={editingMessageId !== null}
                                />
                            </div>
                        </div>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-[#1f1f1f] w-1" />
                
                {/* Vehicle Information Sidebar - Scrollable */}
                <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="min-h-0">
                    <div className="h-full border-l border-[#1f1f1f] bg-[#0d0d0d] overflow-y-auto">
                        <div className="p-4">
                            <VehicleInfoForm
                                vehicleInfo={vehicleInfo}
                                onVehicleInfoChange={setVehicleInfo}
                            />
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}