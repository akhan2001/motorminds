'use client'

import React from 'react'

interface ChatInputProps {
    chatInput: string
    setChatInput: (input: string) => void
    isLoading: boolean
    onSendMessage: () => void
    onClearSession: () => void
    vehicleContext?: {
        year?: string
        make?: string
        model?: string
        engine?: string
    }
    vinDecodeSuccess?: string | null
}

export const ChatInput: React.FC<ChatInputProps> = ({
    chatInput,
    setChatInput,
    isLoading,
    onSendMessage,
    onClearSession,
    vehicleContext,
    vinDecodeSuccess
}) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            onSendMessage()
        }
    }

    return (
        <div className="border-t border-[#2a2a2a] p-4">
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Mia about parts..."
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-[#979797] focus:outline-none focus:border-[#b22222] transition-colors disabled:opacity-50"
                />
                <button
                    onClick={onClearSession}
                    disabled={isLoading}
                    className="px-3 py-2 bg-[#4a4a4a] hover:bg-[#5a5a5a] disabled:bg-[#666] disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                    title="Clear chat and start over"
                >
                    Clear
                </button>
                <button
                    onClick={onSendMessage}
                    disabled={!chatInput.trim() || isLoading}
                    className="px-4 py-2 bg-[#b22222] hover:bg-[#a01e1e] disabled:bg-[#666] disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                    Send
                </button>
            </div>
            
            {/* Current vehicle context */}
            {(vehicleContext?.year || vehicleContext?.make || vehicleContext?.model) && (
                <div className="mt-2 text-xs text-[#979797]">
                    Current vehicle: {vehicleContext?.year && `${vehicleContext.year} `}{vehicleContext?.make && `${vehicleContext.make} `}{vehicleContext?.model && vehicleContext.model}{vehicleContext?.engine && ` (${vehicleContext.engine})`}
                    {vinDecodeSuccess && (
                        <span className="text-green-400 ml-2">✓ VIN Decoded</span>
                    )}
                </div>
            )}
        </div>
    )
}
