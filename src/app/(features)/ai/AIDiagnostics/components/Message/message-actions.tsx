"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, RotateCcw, Check } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip'

interface MessageActionsProps {
    messageId: string
    content: string
    onRegenerate?: () => void
    canRegenerate?: boolean
}

/**
 * Message Actions Component
 * 
 * Provides action buttons for chat messages including copy and regenerate functionality.
 * Actions appear on hover for a clean interface.
 * 
 * @component
 */
export function MessageActions({ 
    messageId, 
    content, 
    onRegenerate, 
    canRegenerate = false 
}: MessageActionsProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy message:', error)
        }
    }

    return (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Copy Button */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                        >
                            {copied ? (
                                <Check className="w-3 h-3 text-green-400" />
                            ) : (
                                <Copy className="w-3 h-3" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{copied ? 'Copied!' : 'Copy message'}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* Regenerate Button */}
            {canRegenerate && onRegenerate && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onRegenerate}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                            >
                                <RotateCcw className="w-3 h-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Regenerate response</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    )
}

