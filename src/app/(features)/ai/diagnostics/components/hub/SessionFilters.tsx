'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Flame, Clock, Calendar, Folder } from 'lucide-react'
import type { DiagnosticSessionStatus } from '../../types/diagnostic-session'
import { cn } from '@/lib/utils'

export type SessionFilterTab = 'active' | 'pending_review' | 'recent' | 'completed'

interface SessionFiltersProps {
	activeTab: SessionFilterTab
	onTabChange: (tab: SessionFilterTab) => void
	counts?: {
		active?: number
		pending_review?: number
		recent?: number
		completed?: number
	}
}

export function SessionFilters({ activeTab, onTabChange, counts }: SessionFiltersProps) {
	const tabs: Array<{
		id: SessionFilterTab
		label: string
		icon: React.ReactNode
		status?: DiagnosticSessionStatus
	}> = [
		{
			id: 'active',
			label: 'Active Sessions',
			icon: <Flame className="w-4 h-4" />,
			status: 'active',
		},
		{
			id: 'pending_review',
			label: 'Pending Review',
			icon: <Clock className="w-4 h-4" />,
			status: 'pending_review',
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
			status: 'completed',
		},
	]

	return (
		<div className="flex items-center gap-2 mb-4 flex-wrap">
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
								: 'bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
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
										: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
								)}
							>
								{count}
							</span>
						)}
					</Button>
				)
			})}
		</div>
	)
}

