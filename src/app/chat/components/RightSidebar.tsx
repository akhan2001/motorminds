'use client'

import React from 'react'
import { VehicleInfo } from './RightSidebar/VehicleInfo'
import { WorkOrdersList } from './RightSidebar/WorkOrdersList'
import { DTCCodesList } from './RightSidebar/DTCCodesList'
import { PartsInsights } from './RightSidebar/PartsInsights'
import { ServiceHistory } from './RightSidebar/ServiceHistory'
import { DiagramsSection } from './RightSidebar/DiagramsSection'
import { ChevronRight } from 'lucide-react'

interface RightSidebarProps {
	vehicle: any
	workOrders: any[]
	dtcCodes: any
	parts: any[]
	serviceHistory: any[]
	diagrams: any[]
	onCollapse?: () => void
}

export function RightSidebar({
	vehicle,
	workOrders,
	dtcCodes,
	parts,
	serviceHistory,
	diagrams,
	onCollapse
}: RightSidebarProps) {
	return (
		<div className="h-full bg-gray-50 dark:bg-[#131313] flex flex-col">
			{/* Header with Collapse Button */}
			<div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-[#222222] flex items-center justify-between">
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white">
					Vehicle Context
				</h3>
				{onCollapse && (
					<button
						onClick={onCollapse}
						className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#222222] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
						title="Collapse sidebar"
					>
						<ChevronRight className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-4 space-y-4">
					{/* Section A - Vehicle Overview */}
					<VehicleInfo vehicle={vehicle} />

					{/* Section B - Active Work Orders */}
					<WorkOrdersList workOrders={workOrders} />

					{/* Section C - DTC Codes */}
					<DTCCodesList dtcCodes={dtcCodes} />

					{/* Section D - Parts Insights */}
					<PartsInsights parts={parts} />

					{/* Section E - Service History */}
					<ServiceHistory history={serviceHistory} />

					{/* Section F - Diagrams & Procedures */}
					<DiagramsSection diagrams={diagrams} />
				</div>
			</div>
		</div>
	)
}

