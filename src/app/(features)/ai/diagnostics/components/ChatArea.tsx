'use client'

import React from 'react'
import { AIDiagnosticsPanel } from './AIDiagnosticsPanel'
import VehicleSelector, { SandboxVehicle } from './VehicleSelector'
import { Car, Calendar, User } from 'lucide-react'

interface ChatAreaProps {
	vehicle: any
	workOrder: any
	shopId?: string
	selectedSandboxVehicle: SandboxVehicle | null
	onSandboxVehicleSelect: (vehicle: SandboxVehicle) => void
	sessionId?: string
}

export function ChatArea({ 
	vehicle, 
	workOrder, 
	shopId, 
	selectedSandboxVehicle,
	onSandboxVehicleSelect,
	sessionId
}: ChatAreaProps) {
	// Use sandbox vehicle if selected, otherwise use mock vehicle
	const activeVehicle = selectedSandboxVehicle || vehicle
	const isSessionActive = !!sessionId

	// Handle null vehicle case
	if (!activeVehicle) {
		return (
			<div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] items-center justify-center">
				<p className="text-muted-foreground">No vehicle selected</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
			{/* Chat Header */}
			<div className="flex-shrink-0 border-b border-gray-200 dark:border-[#222222] bg-gray-50 dark:bg-[#131313] px-6 py-4">
				<div className="flex items-center justify-between gap-4">
					{/* Vehicle Selector */}
					<div className="flex-shrink-0">
						<VehicleSelector
							selectedVehicle={selectedSandboxVehicle}
							onVehicleSelect={isSessionActive ? () => {} : onSandboxVehicleSelect}
							readOnly={isSessionActive}
							lockMessage="Vehicle and engine are locked for this diagnostic session"
							showEngineSelector={!isSessionActive}
						/>
					</div>

					{/* Vehicle Info */}
					<div className="flex-1 min-w-0">
						<h1 className="text-lg font-semibold text-gray-900 dark:text-white">
							{activeVehicle.year} {activeVehicle.make} {activeVehicle.model}
							{activeVehicle.engineName && <span className="text-sm text-gray-500 dark:text-gray-400"> ({activeVehicle.engineName})</span>}
						</h1>
						<div className="flex items-center gap-4 mt-1">
							<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
								<Car className="w-3.5 h-3.5" />
								<span>{activeVehicle.vin?.slice(-8) || activeVehicle.plate || 'N/A'}</span>
							</div>
							{workOrder && (
								<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
									<Calendar className="w-3.5 h-3.5" />
									<span>WO #{workOrder.number}</span>
								</div>
							)}
							{activeVehicle.customerName && (
								<div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
									<User className="w-3.5 h-3.5" />
									<span>{activeVehicle.customerName}</span>
								</div>
							)}
						</div>
					</div>

					{/* Status Badge */}
					<div className="flex-shrink-0">
						<span className="px-2.5 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
							Active
						</span>
					</div>
				</div>
			</div>

			{/* Chat Panel */}
			<div className="flex-1 min-h-0">
				<AIDiagnosticsPanel
					shopId={shopId}
					sessionId={sessionId}
					workOrderId={workOrder?.id}
					vehicleId={activeVehicle.id || activeVehicle.motorId}
					baseVehicleId={activeVehicle.baseVehicleId}
					engineId={activeVehicle.engineId}
					vehicleContext={selectedSandboxVehicle || (activeVehicle.year && activeVehicle.make && activeVehicle.model ? {
						motorId: activeVehicle.motorId || activeVehicle.id,
						baseVehicleId: activeVehicle.baseVehicleId || activeVehicle.modelID,
						year: activeVehicle.year,
						make: activeVehicle.make,
						model: activeVehicle.model,
						makeID: activeVehicle.makeID,
						modelID: activeVehicle.modelID,
						vin: activeVehicle.vin,
						engineId: activeVehicle.engineId,
						engineName: activeVehicle.engineName
					} as SandboxVehicle : null)}
					dtcCodes={activeVehicle.activeDTCCodes}
					reportedIssue={workOrder?.reportedIssue}
					className="h-full"
				/>
			</div>
		</div>
	)
}
