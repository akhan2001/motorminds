"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp } from 'lucide-react'

interface DiagnosticsInputProps {
    chatInstance: any
    selectedVehicleId: number | null
}

const QUICK_PROMPTS = [
    "Get me the vehicles details",
    "Show me diagnostic trouble codes",
    "What are common issues?",
    "What fluids does this vehicle use?",
    "What's the spark plug part number?"
]

export function DiagnosticsInput({ chatInstance, selectedVehicleId }: DiagnosticsInputProps) {
    const [localInput, setLocalInput] = useState('')
    const status = chatInstance?.status || 'idle'
    const isLoading = status === 'loading' || status === 'streaming'
    const sendMessage = chatInstance?.sendMessage
    const hasAnyMessage = Array.isArray(chatInstance?.messages) && chatInstance.messages.length > 0
    const canSubmit = localInput?.trim() && !isLoading && selectedVehicleId

    const handleQuickPrompt = async (prompt: string) => {
        if (!selectedVehicleId || !sendMessage) return
        
        try {
            await sendMessage({
                role: 'user',
                content: prompt
            })
        } catch (error) {
            console.error('Failed to send quick prompt:', error)
        }
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!localInput.trim() || !selectedVehicleId || !sendMessage) return
        
        console.log('Form submitted with:', localInput.trim())
        console.log('Vehicle ID:', selectedVehicleId)
        
        try {
            await sendMessage({
                role: 'user',
                content: localInput.trim()
            })
            setLocalInput('')
        } catch (error) {
            console.error('Failed to send message:', error)
        }
    }

    return (
        <div className="p-4 border-t border-[#1f1f1f]">
            {/* Quick Prompts (hide after first message) */}
            {selectedVehicleId && !hasAnyMessage && (
                <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-2">Quick Prompts:</p>
                    <div className="flex flex-wrap gap-1">
                        {QUICK_PROMPTS.map((prompt, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickPrompt(prompt)}
                                className="text-xs h-6 px-2 bg-[#1f1f1f] border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a] hover:text-white"
                                disabled={isLoading}
                            >
                                {prompt}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleFormSubmit} className="relative">
                <Textarea
                    value={localInput}
                    onChange={(e) => setLocalInput(e.target.value)}
                    placeholder={
                        selectedVehicleId 
                            ? "Ask about diagnostics, parts, or maintenance..." 
                            : "Please select a vehicle first..."
                    }
                    className="w-full min-h-[40px] max-h-40 resize-none bg-[#111111] border-[#2a2a2a] text-white placeholder-gray-400 pr-10 pb-9"
                    disabled={isLoading || !selectedVehicleId}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleFormSubmit(e as any)
                        }
                    }}
                />

                {/* Bottom overlay actions inside textarea area */}
                <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-end pointer-events-none">
                    <div className="pointer-events-auto">
                        <Button
                            type="submit"
                            aria-label="Send message"
                            title="Send message"
                            disabled={!canSubmit}
                            className={`w-7 h-7 rounded-full p-0 text-center flex items-center justify-center bg-red-600 hover:bg-red-700 text-white ${!canSubmit ? 'opacity-50' : 'opacity-100'}`}
                        >
                            <ArrowUp className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
