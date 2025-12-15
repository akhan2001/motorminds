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

interface AIDiagnosticsLayoutProps {
	shopId?: string
}

// Temporary placeholder types
type SandboxVehicle = any

const RightSidebar = ({ vehicle, workOrders, dtcCodes, parts, serviceHistory, diagrams }: any) => (
	<div className="h-full bg-gray-50 dark:bg-[#131313] border-l border-gray-200 dark:border-[#222222] p-4">
		<div className="flex justify-between items-center mb-4">
			<h3 className="font-semibold">Context</h3>
		</div>
		<p className="text-sm text-muted-foreground">RightSidebar component - TODO: Implement</p>
	</div>
)

export function AIDiagnosticsLayout({ shopId }: AIDiagnosticsLayoutProps) {
	const [selectedVehicle, setSelectedVehicle] = useState(mockVehicleData)
	const [selectedSandboxVehicle, setSelectedSandboxVehicle] = useState<SandboxVehicle | null>(null)
	const [selectedWorkOrder, setSelectedWorkOrder] = useState(mockWorkOrders[0] || null)

	return (
		<div className="flex h-full w-full overflow-hidden min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full">
				{/* Center - Chat Area */}
				<ResizablePanel defaultSize={70} minSize={60} maxSize={75}>
					<div className="flex-1 flex flex-col min-w-0 h-full">
						<ChatArea
							vehicle={selectedVehicle}
							workOrder={selectedWorkOrder}
							shopId={shopId}
							selectedSandboxVehicle={selectedSandboxVehicle}
							onSandboxVehicleSelect={setSelectedSandboxVehicle}
						/>
					</div>
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Right Sidebar - Contextual Data */}
				<ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
					<RightSidebar
						vehicle={selectedSandboxVehicle || selectedVehicle}
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
