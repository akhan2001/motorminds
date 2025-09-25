'use client'

import React from 'react'
import { MessageSquare, Send, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export interface ChatPanelProps {
    workOrderId: string
    shopId?: string
    workOrderStatus?: string
    className?: string
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    workOrderId,
    shopId,
    workOrderStatus,
    className = ""
}) => {
    return (
        <div className={`w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full min-h-0 ${className}`}>
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div className="p-4 space-y-4">
                    {/* Coming Soon Message */}
                    <div className="bg-[#1a1a1a] rounded-lg p-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mx-auto mb-4">
                                <MessageSquare className="h-8 w-8 text-blue-400" />
                            </div>
                            <h4 className="text-white font-medium text-lg mb-2">
                                Real-time Communication
                            </h4>
                            <p className="text-gray-400 text-sm mb-4">
                                Chat functionality for work orders is coming soon.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mock Input Area */}
            <div className="p-4 border-t border-[#222222] flex-shrink-0">
                <div className="flex gap-2">
                    <Input
                        placeholder="Type a message... (coming soon)"
                        disabled
                        className="flex-1 bg-[#2a2a2a] border-[#3a3a3a] text-gray-400 placeholder-gray-500"
                    />
                    <Button 
                        disabled
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                    Chat functionality is under development
                </p>
            </div>
        </div>
    )
}
