'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Flame, Clock, Calendar, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SessionFilterTab = 'active' | 'pending_review' | 'recent' | 'completed'

interface DiagnosticsHubHeaderProps {
	searchQuery: string
	onSearchChange: (query: string) => void
	onNewSession: () => void
	activeTab: SessionFilterTab
	onTabChange: (tab: SessionFilterTab) => void
	counts?: {
		active?: number
		pending_review?: number
		recent?: number
		completed?: number
	}
}

export function DiagnosticsHubHeader({
	searchQuery,
	onSearchChange,
	onNewSession,
	activeTab,
	onTabChange,
	counts,
}: DiagnosticsHubHeaderProps) {
	const [localSearch, setLocalSearch] = useState(searchQuery)

	// Debounce search
	React.useEffect(() => {
		const timer = setTimeout(() => {
			onSearchChange(localSearch)
		}, 300)

		return () => clearTimeout(timer)
	}, [localSearch, onSearchChange])

	const tabs: Array<{
		id: SessionFilterTab
		label: string
		icon: React.ReactNode
	}> = [
		{
			id: 'active',
			label: 'Active Sessions',
			icon: <Flame className="w-4 h-4" />,
		},
		{
			id: 'pending_review',
			label: 'Pending Review',
			icon: <Clock className="w-4 h-4" />,
		},
		{
			id: 'recent',
			label: 'Recent Sessions',
			icon: <Calendar className="w-4 h-4" />,
		},
		{
			id: 'completed',
			label: 'All Completed',
			icon: <Folder className="w-4 h-4" />,
		},
	]

	return (
		<div className="space-y-4">
			{/* Top Row: Title, Search, and New Session Button */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<h2 className="text-2xl font-semibold text-foreground">
						AI Diagnostics Hub
					</h2>
				</div>

				<div className="flex items-center gap-3 w-full sm:w-auto">
					{/* Search Input */}
					<div className="relative flex-1 sm:flex-initial sm:w-64">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search Sessions (e.g., VIN, Plate, WO#, Mechanic)"
							value={localSearch}
							onChange={(e) => setLocalSearch(e.target.value)}
							className="pl-9 pr-4 h-9 text-sm"
						/>
					</div>

					{/* New Session Button */}
					<Button
						onClick={onNewSession}
						className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white whitespace-nowrap"
					>
						<Plus className="w-4 h-4 mr-2" />
						New Session
					</Button>
				</div>
			</div>

			{/* Bottom Row: Filter Tabs */}
			<div className="flex items-center gap-2 flex-wrap">
				{tabs.map((tab) => {
					const count = counts?.[tab.id]
					const isActive = activeTab === tab.id

					return (
						<Button
							key={tab.id}
							variant={isActive ? 'default' : 'outline'}
							onClick={() => onTabChange(tab.id)}
							className={cn(
								'flex items-center gap-2 h-9 px-4 text-sm',
								isActive
									? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
									: 'bg-card border-border text-foreground hover:bg-accent'
							)}
						>
							{tab.icon}
							<span>{tab.label}</span>
							{count !== undefined && (
								<span
									className={cn(
										'ml-1 px-1.5 py-0.5 rounded text-xs',
										isActive
											? 'bg-blue-700 dark:bg-blue-800 text-white'
											: 'bg-muted text-muted-foreground'
									)}
								>
									{count}
								</span>
							)}
						</Button>
					)
				})}
			</div>
		</div>
	)
}

