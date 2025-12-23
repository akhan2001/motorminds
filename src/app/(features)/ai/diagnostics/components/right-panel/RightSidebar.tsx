'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VehicleInfo } from './sections/VehicleInfo'
import { DTCCodes } from './sections/DTCCodes'
import { WorkOrders } from './sections/WorkOrders'
import { Parts } from './sections/Parts'
import { ServiceHistory } from './sections/ServiceHistory'
import { Diagrams } from './sections/Diagrams'

interface RightSidebarProps {
	vehicle: any
	workOrders: any[]
	dtcCodes: any[]
	parts: any[]
	serviceHistory: any[]
	diagrams: any[]
}

export function RightSidebar({
	vehicle,
	workOrders,
	dtcCodes,
	parts,
	serviceHistory,
	diagrams,
}: RightSidebarProps) {
	return (
		<div className="h-full flex flex-col bg-gray-50 dark:bg-[#131313] border-l border-gray-200 dark:border-[#222222]">
			{/* Header */}
			<div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-[#222222]">
				<h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Context</h3>
				<p className="text-xs text-muted-foreground mt-0.5">Vehicle information & diagnostics</p>
			</div>

			{/* Tabs Content */}
			<Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
				<TabsList className="mx-4 mt-3 flex-shrink-0">
					<TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
					<TabsTrigger value="dtc" className="text-xs">
						DTCs ({dtcCodes.length})
					</TabsTrigger>
					<TabsTrigger value="work-orders" className="text-xs">
						Work Orders ({workOrders.length})
					</TabsTrigger>
					<TabsTrigger value="parts" className="text-xs">
						Parts ({parts.length})
					</TabsTrigger>
				</TabsList>

				<ScrollArea className="flex-1 px-4 pb-4">
					<TabsContent value="overview" className="mt-4 space-y-4">
						<VehicleInfo vehicle={vehicle} />
						<DTCCodes dtcCodes={dtcCodes} />
						<ServiceHistory serviceHistory={serviceHistory} />
						<Diagrams diagrams={diagrams} />
					</TabsContent>

					<TabsContent value="dtc" className="mt-4">
						<DTCCodes dtcCodes={dtcCodes} detailed />
					</TabsContent>

					<TabsContent value="work-orders" className="mt-4">
						<WorkOrders workOrders={workOrders} />
					</TabsContent>

					<TabsContent value="parts" className="mt-4">
						<Parts parts={parts} />
					</TabsContent>
				</ScrollArea>
			</Tabs>
		</div>
	)
}

