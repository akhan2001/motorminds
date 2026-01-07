'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Search, Plus, Flame, Clock, Calendar, Folder, Settings, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SessionFilterTab = 'active' | 'pending_review' | 'recent' | 'completed'

interface DiagnosticsHubHeaderProps {
	className?: string
	isCompactView?: boolean
	onToggleView?: () => void
	searchQuery: string
	onSearchChange: (query: string) => void
	onNewSession: () => void
	onSettingsClick?: () => void
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
	className,
	isCompactView = false,
	onToggleView,
	searchQuery,
	onSearchChange,
	onNewSession,
	onSettingsClick,
	activeTab,
	onTabChange,
	counts,
}: DiagnosticsHubHeaderProps) {
	const [localSearch, setLocalSearch] = useState(searchQuery)

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			onSearchChange(localSearch)
		}, 300)

		return () => clearTimeout(timer)
	}, [localSearch, onSearchChange])

	const tabs: Array<{
		id: SessionFilterTab
		label: string
		icon: React.ComponentType<{ className?: string }>
	}> = [
		{
			id: 'active',
			label: 'Active Sessions',
			icon: Flame,
		},
		{
			id: 'pending_review',
			label: 'Pending Review',
			icon: Clock,
		},
		{
			id: 'recent',
			label: 'Recent Sessions',
			icon: Calendar,
		},
		{
			id: 'completed',
			label: 'All Completed',
			icon: Folder,
		},
	]

	return (
		<div className={cn("bg-background border-b border-border flex-shrink-0", className)}>
			{/* Main Header */}
			<div className="px-6 py-3">
				<div className="flex items-center justify-between">
					{/* Left Section - Title */}
					<div className="flex items-center gap-6">
						<div>
							<h1 className="text-2xl font-bold text-foreground">AI Diagnostics Hub</h1>
							<p className="text-sm text-muted-foreground mt-1">
								Manage and analyze diagnostic sessions
							</p>
						</div>
					</div>

					{/* Right Section - Actions */}
					<div className="flex items-center gap-3">
						{/* Search Bar */}
						<div className="relative w-80">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search Sessions (e.g., VIN, Plate, WO#, Mechanic)"
								value={localSearch}
								onChange={(e) => setLocalSearch(e.target.value)}
								className="pl-10 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-red-500"
							/>
						</div>

						{/* Settings Button */}
						{onSettingsClick && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											onClick={onSettingsClick}
											className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground w-9 h-9"
										>
											<Settings className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>AI Settings</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}

						{/* New Session Button */}
						<Button
							size="sm"
							className="bg-red-600 hover:bg-red-700 text-white"
							onClick={onNewSession}
						>
							<Plus className="h-4 w-4 mr-2" />
							New Session
						</Button>

						{/* Compact View Toggle - Icon Only */}
						{onToggleView && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="outline"
											size="icon"
											className="bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground w-9 h-9"
											onClick={onToggleView}
										>
											{isCompactView ? (
												<Maximize2 className="h-4 w-4" />
											) : (
												<Minimize2 className="h-4 w-4" />
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{isCompactView ? 'Enlarge View' : 'Compact View'}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
				</div>
			</div>

			{/* Action Buttons Bar */}
			<div className="px-6 pb-3">
				<div className="flex items-center gap-2">
					{tabs.map((tab) => {
						const count = counts?.[tab.id]
						const isActive = activeTab === tab.id
						const Icon = tab.icon

						return (
							<Button
								key={tab.id}
								variant="outline"
								size="sm"
								onClick={() => onTabChange(tab.id)}
								className={cn(
									"bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-foreground",
									isActive && "bg-red-600 text-white hover:bg-red-600 hover:text-white border-red-600"
								)}
							>
								<Icon className="h-4 w-4 mr-2" />
								{tab.label}
								{count !== undefined && (
									<span
										className={cn(
											"ml-2 px-1.5 py-0.5 rounded text-xs",
											isActive
												? "bg-red-700 text-white"
												: "bg-muted text-muted-foreground"
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
		</div>
	)
}

