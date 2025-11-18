'use client'

import React from 'react'

export interface ChatPanelProps {
    workOrderId: string
    shopId?: string
    workOrderStatus?: string
    vehicleId?: number
    baseVehicleId?: number
    dtcCodes?: string[]
    reportedIssue?: string
    className?: string
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    workOrderId,
    shopId,
    vehicleId,
    baseVehicleId,
    dtcCodes,
    reportedIssue,
    className = ""
}) => {
    return (
        <div className={`w-full flex flex-col h-full min-h-0 p-4 ${className}`}>
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p className="text-sm">Chat panel - Coming soon</p>
            </div>
        </div>
    )
}
