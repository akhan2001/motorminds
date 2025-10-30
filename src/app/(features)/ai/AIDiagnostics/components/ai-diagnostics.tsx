"use client"

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { AIDiagnosticsSidebar } from './AIAssistantPanel/ai-diagnostics-sidebar'
import { TEST_VEHICLES } from '@/lib/integrations/motor-daas/test-vehicles'
import type { MotorVehicle } from '@/lib/integrations/motor-daas/types'

/**
 * Main AI Diagnostics Container Component
 * 
 * Manages the state and chat instance for the MIA diagnostics assistant.
 * Integrates with MOTOR DaaS for vehicle-specific diagnostic assistance.
 * 
 * @component
 */
export function AiDiagnostics() {
    // Vehicle selection state
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
    
    // Single useChat instance - shared by all child components
    // This ensures consistent state management across the chat interface
    const chatInstance = useChat({
        api: '/api/ai/diagnostics',
        body: {
            selectedVehicleId
        },
        initialMessages: [
            {
                id: '1',
                role: 'assistant',
                content: 'Hello! I\'m MIA, your automotive diagnostics assistant. Please select a vehicle to get started with diagnostic assistance.'
            }
        ]
    })

    // Get the full vehicle object for display
    const selectedVehicle: MotorVehicle | undefined = TEST_VEHICLES.find(
        v => v.motorVehicleId === selectedVehicleId
    )

    const handleClose = () => {
        // Dispatch event to close the panel from operations page
        window.dispatchEvent(new CustomEvent('toggle-ai-panel'))
    }

    return (
        <AIDiagnosticsSidebar
            isOpen={true}
            onClose={handleClose}
            selectedVehicleId={selectedVehicleId}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicleId}
            chatInstance={chatInstance}
            vehicles={TEST_VEHICLES}
        />
    )
}

