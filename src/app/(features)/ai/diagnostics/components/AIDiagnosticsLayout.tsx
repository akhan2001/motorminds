'use client'

import React, { useState } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ChatArea } from './ChatArea'
import {
	mockVehicleData,
	mockWorkOrders,
	mockDTCCodes,
	mockParts,
	mockServiceHistory,
	mockDiagrams
} from '../types/MockData'
import { RightSidebar } from './right-panel'
import type { SandboxVehicle } from './VehicleSelector'

interface AIDiagnosticsLayoutProps {
	shopId?: string
	sessionId?: string
	vehicleContext?: SandboxVehicle | null
}

export function AIDiagnosticsLayout({ 
	shopId, 
	sessionId,
	vehicleContext 
}: AIDiagnosticsLayoutProps) {
	// Lock vehicle when session exists - use vehicleContext directly
	const isSessionActive = !!sessionId
	const activeVehicle = isSessionActive 
		? vehicleContext  // Lock to session vehicle
		: (vehicleContext || mockVehicleData)  // Allow selection for new sessions

	// Only allow vehicle selection if no session
	const [selectedSandboxVehicle, setSelectedSandboxVehicle] = useState<SandboxVehicle | null>(
		isSessionActive ? null : (vehicleContext || null)  // Don't allow state changes if session active
	)
	const [selectedWorkOrder, setSelectedWorkOrder] = useState(mockWorkOrders[0] || null)

	return (
		<div className="flex h-full w-full overflow-hidden min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full">
				{/* Center - Chat Area */}
				<ResizablePanel defaultSize={70} minSize={60} maxSize={75}>
					<div className="flex-1 flex flex-col min-w-0 h-full">
						<ChatArea
							vehicle={activeVehicle}
							workOrder={selectedWorkOrder}
							shopId={shopId}
							selectedSandboxVehicle={isSessionActive ? vehicleContext : selectedSandboxVehicle}
							onSandboxVehicleSelect={isSessionActive ? () => {} : setSelectedSandboxVehicle}
							sessionId={sessionId}
						/>
					</div>
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Right Sidebar - Contextual Data */}
				<ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
					<RightSidebar
						vehicle={isSessionActive ? vehicleContext : (selectedSandboxVehicle || activeVehicle)}
						workOrders={mockWorkOrders}
						dtcCodes={mockDTCCodes.active}
						parts={mockParts}
						serviceHistory={mockServiceHistory}
						diagrams={mockDiagrams}
					/>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	)
}
