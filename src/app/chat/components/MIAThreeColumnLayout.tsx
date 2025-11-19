'use client'

import React, { useState, useRef, useCallback } from 'react'
import { ChatArea } from './ChatArea'
import { RightSidebar } from './RightSidebar'
import { mockVehicleData, mockWorkOrders, mockDTCCodes, mockParts, mockServiceHistory, mockDiagrams } from './mockData'
import { ChevronRight, ChevronLeft } from 'lucide-react'

interface MIAThreeColumnLayoutProps {
	shopId?: string
}

export function MIAThreeColumnLayout({ shopId }: MIAThreeColumnLayoutProps) {
	const [selectedVehicle, setSelectedVehicle] = useState(mockVehicleData)
	const [selectedWorkOrder, setSelectedWorkOrder] = useState(mockWorkOrders[0] || null)
	const [sidebarWidth, setSidebarWidth] = useState(384) // 24rem = 384px
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isResizing, setIsResizing] = useState(false)
	const sidebarRef = useRef<HTMLDivElement>(null)

	const startResizing = useCallback((e: React.MouseEvent) => {
		setIsResizing(true)
		e.preventDefault()
	}, [])

	const stopResizing = useCallback(() => {
		setIsResizing(false)
	}, [])

	const resize = useCallback(
		(e: MouseEvent) => {
			if (isResizing && sidebarRef.current) {
				const newWidth = window.innerWidth - e.clientX
				// Min width: 320px, Max width: 600px
				if (newWidth >= 320 && newWidth <= 600) {
					setSidebarWidth(newWidth)
				}
			}
		},
		[isResizing]
	)

	React.useEffect(() => {
		if (isResizing) {
			window.addEventListener('mousemove', resize)
			window.addEventListener('mouseup', stopResizing)
			document.body.style.cursor = 'col-resize'
			document.body.style.userSelect = 'none'
		} else {
			document.body.style.cursor = ''
			document.body.style.userSelect = ''
		}

		return () => {
			window.removeEventListener('mousemove', resize)
			window.removeEventListener('mouseup', stopResizing)
		}
	}, [isResizing, resize, stopResizing])

	return (
		<div className="flex h-full w-full overflow-hidden">
			{/* Center - Chat Area */}
			<div className="flex-1 flex flex-col min-w-0">
				<ChatArea
					vehicle={selectedVehicle}
					workOrder={selectedWorkOrder}
					shopId={shopId}
				/>
			</div>

			{/* Right Sidebar - Contextual Data with Resize Handle */}
			{!isCollapsed && (
				<>
					{/* Resize Handle */}
					<div
						onMouseDown={startResizing}
						className="w-1 hover:w-1.5 bg-gray-200 dark:bg-[#222222] hover:bg-red-500 dark:hover:bg-red-600 cursor-col-resize transition-all relative group"
					>
						<div className="absolute inset-y-0 -left-1 -right-1" />
					</div>

					{/* Right Sidebar */}
					<div
						ref={sidebarRef}
						style={{ width: `${sidebarWidth}px` }}
						className="flex-shrink-0"
					>
						<RightSidebar
							vehicle={selectedVehicle}
							workOrders={mockWorkOrders}
							dtcCodes={mockDTCCodes}
							parts={mockParts}
							serviceHistory={mockServiceHistory}
							diagrams={mockDiagrams}
							onCollapse={() => setIsCollapsed(true)}
						/>
					</div>
				</>
			)}

			{/* Collapsed Sidebar Toggle */}
			{isCollapsed && (
				<div className="flex-shrink-0 w-12 bg-gray-50 dark:bg-[#131313] border-l border-gray-200 dark:border-[#222222] flex items-start justify-center pt-4">
					<button
						onClick={() => setIsCollapsed(false)}
						className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#222222] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
						title="Expand sidebar"
					>
						<ChevronLeft className="w-5 h-5" />
					</button>
				</div>
			)}
		</div>
	)
}

