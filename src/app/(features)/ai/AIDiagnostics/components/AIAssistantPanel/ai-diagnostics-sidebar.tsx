"use client"

import { DiagnosticsChat } from './diagnostics-chat'
import { DiagnosticsInput } from './diagnostics-input'
import { DiagnosticChatHeader } from './diagnostic-chat-header'
import { VehicleSelector } from './vehicle-selector'
import type { MotorVehicle } from '@/lib/integrations/motor-daas/types'
import type { UseChatHelpers } from '@ai-sdk/react'

interface AIDiagnosticsSidebarProps {
    isOpen: boolean
    onClose: () => void
    selectedVehicleId: number | null
    selectedVehicle?: MotorVehicle
    onVehicleSelect: (vehicleId: number) => void
    chatInstance: UseChatHelpers<any>
    vehicles: MotorVehicle[]
    isChatLoading?: boolean
    onNewChat?: () => void
    onSettingsClick?: () => void
    currentSessionName?: string
    showMetadataWarning?: boolean
    aiOptInLevel?: 'none' | 'basic' | 'full'
    onPermissionSettings?: () => void
}

export function AIDiagnosticsSidebar({ 
    isOpen, 
    onClose,
    selectedVehicleId,
    selectedVehicle,
    onVehicleSelect,
    chatInstance,
    vehicles,
    isChatLoading = false,
    onNewChat,
    onSettingsClick,
    currentSessionName = "New Session",
    showMetadataWarning = false,
    aiOptInLevel = 'basic',
    onPermissionSettings
}: AIDiagnosticsSidebarProps) {
    if (!isOpen) return null

    return (
        <div className="h-full min-h-0 bg-[#0d0d0d] border-l border-[#1f1f1f] flex flex-col">
            {/* Sticky Header - Fixed at top */}
            <div className="sticky top-0 z-10 bg-[#0d0d0d] border-b border-[#1f1f1f]">
                <DiagnosticChatHeader
                    isChatLoading={chatInstance.status === 'loading' || chatInstance.status === 'streaming'}
                    onNewChat={onNewChat}
                    onCloseAssistant={onClose}
                    onSettingsClick={onSettingsClick}
                    currentSessionName={currentSessionName}
                    showMetadataWarning={showMetadataWarning}
                    aiOptInLevel={aiOptInLevel}
                    onPermissionSettings={onPermissionSettings}
                />

                {/* Vehicle Selector - Part of sticky header */}
                <VehicleSelector
                    vehicles={vehicles}
                    selectedVehicleId={selectedVehicleId}
                    onVehicleSelect={onVehicleSelect}
                />
            </div>

            {/* Scrollable Chat Area - Takes remaining space */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <DiagnosticsChat chatInstance={chatInstance} />
            </div>

            {/* Input Area - Pinned at bottom via flex shrink */}
            <div className="shrink-0 bg-[#0d0d0d] border-t border-[#1f1f1f]">
                <DiagnosticsInput
                    chatInstance={chatInstance}
                    selectedVehicleId={selectedVehicleId}
                />
            </div>
        </div>
    )
}
