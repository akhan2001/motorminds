'use client'

import React from 'react'
import { MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
        <div className={`w-full bg-slate-50 dark:bg-background border-l border-border flex flex-col h-full min-h-0 ${className}`}>
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                <div className="p-4 space-y-4">
                    {/* Coming Soon Message */}
                    <div className="bg-white dark:bg-card rounded-lg p-6 border border-border">
                        <div className="text-center">
                            <div className="flex items-center justify-center w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full mx-auto mb-4">
                                <MessageSquare className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <h4 className="text-foreground font-medium text-lg mb-2">
                                Real-time Communication
                            </h4>
                            <p className="text-muted-foreground text-sm mb-4">
                                Chat functionality for work orders is coming soon.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mock Input Area */}
            <div className="p-4 border-t border-border flex-shrink-0 bg-white dark:bg-background">
                <div className="flex gap-2">
                    <Input
                        placeholder="Type a message... (coming soon)"
                        disabled
                        className="flex-1 bg-white dark:bg-background border-border text-foreground placeholder-muted-foreground"
                    />
                    <Button 
                        disabled
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    Chat functionality is under development
                </p>
            </div>
        </div>
    )
}
