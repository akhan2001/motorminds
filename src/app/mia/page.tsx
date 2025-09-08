'use client'

import { useChat } from 'ai/react'
import type { Message } from 'ai'
import { ChangeEvent, useState } from 'react'

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
                content: data.content || data.fullResponse?.choices?.[0]?.message?.content || 'No response received'
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
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav />

            {/* Header controls */}
            <div className="px-4 py-3">
                <MiaDiagnosticsHeader
                    isChatLoading={isLoading}
                    onClearMessages={handleClearMessages}
                    onCloseAssistant={handleCloseAssistant}
                    vehicleInfo={vehicleInfo}
                />
            </div>

            {/* Main content area with simple layout */}
            <div className="flex-1 flex min-h-0">
                {/* Main Chat Area */}
                <div className="flex-1 px-4 py-4 min-h-0">
                    <div className="h-full w-full border border-[#1f1f1f] rounded-md overflow-hidden flex flex-col">
                        {/* Chat Content */}
                        <div className="flex-1 flex flex-col min-h-0">
                            {hasMessages ? (
                                <Conversation className="flex-1">
                                    <ConversationContent className="max-w-4xl mx-auto">
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
                                <div className="flex-1 flex items-center justify-center p-4">
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

                        {/* Chat Input Form - Always at bottom */}
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
                </div>

                {/* Vehicle Information Sidebar */}
                <div className="w-80 px-4 py-4 min-h-0">
                    <div className="h-full w-full border border-[#1f1f1f] rounded-md overflow-y-auto bg-[#0d0d0d]">
                        <div className="p-4">
                            <VehicleInfoForm
                                vehicleInfo={vehicleInfo}
                                onVehicleInfoChange={setVehicleInfo}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}