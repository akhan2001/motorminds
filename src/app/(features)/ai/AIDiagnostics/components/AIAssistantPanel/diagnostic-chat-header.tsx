"use client"

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DiagnosticChatHeaderProps {
    isChatLoading?: boolean
    onNewChat?: () => void
    onCloseAssistant?: () => void
    onSettingsClick?: () => void
    currentSessionName?: string
    showMetadataWarning?: boolean
    aiOptInLevel?: 'none' | 'basic' | 'full'
    onPermissionSettings?: () => void
}

export function DiagnosticChatHeader({
    isChatLoading = false,
    onNewChat,
    onCloseAssistant,
    onSettingsClick,
    currentSessionName = "New Session",
    showMetadataWarning = false,
    aiOptInLevel = 'basic',
    onPermissionSettings
}: DiagnosticChatHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    return (
        <div className="sticky top-0 z-10 bg-[#0d0d0d] border-b border-[#1f1f1f]">
            {/* Main Header */}
            <div className="flex items-center justify-between p-4">
                {/* Left Side - Branding & Chat Selector */}
                <div className="flex items-center gap-3">
                    {/* AI Icon with Animation */}
                    <div className="relative">
                        <div className="w-6 h-6 bg-transparent flex items-center justify-center">
                            <img src="/red-motorminds-logo-svg.svg" alt="MIA Logo" className="w-full h-full object-contain hover:brightness-125 transition-all duration-200" />
                        </div>
                        {isChatLoading && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                        )}
                    </div>
                </div>

                {/* Right Side - Action Buttons */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCloseAssistant}
                        disabled={isChatLoading}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Warning Banner - Conditional */}
            {showMetadataWarning && (
                <div className="px-4 pb-3">
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <div className="w-4 h-4 text-yellow-400 mt-0.5">⚠️</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-yellow-200 text-xs font-medium mb-1">
                                    Data Sharing Notice
                                </p>
                                <p className="text-yellow-300/80 text-xs leading-relaxed">
                                    This chat may share your shop data, vehicle information, and diagnostic codes
                                    with AI services to provide better assistance.
                                    {aiOptInLevel === 'none' && (
                                        <span className="block mt-1 font-medium">
                                            Currently sharing: <Badge variant="destructive" className="ml-1">No Data</Badge>
                                        </span>
                                    )}
                                    {aiOptInLevel === 'basic' && (
                                        <span className="block mt-1 font-medium">
                                            Currently sharing: <Badge variant="secondary" className="ml-1">Basic Info</Badge>
                                        </span>
                                    )}
                                    {aiOptInLevel === 'full' && (
                                        <span className="block mt-1 font-medium">
                                            Currently sharing: <Badge variant="default" className="ml-1">Full Context</Badge>
                                        </span>
                                    )}
                                </p>
                                {onPermissionSettings && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onPermissionSettings}
                                        className="mt-2 h-6 px-2 text-yellow-200 hover:text-white hover:bg-yellow-800/30"
                                    >
                                        Permission Settings
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}