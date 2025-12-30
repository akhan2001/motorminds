'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useDiagnosticSessionStats } from '../../hooks/use-diagnostic-sessions'
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DiagnosticsOverviewProps {
	shopId: string
}

export function DiagnosticsOverview({ shopId }: DiagnosticsOverviewProps) {
	const { data: stats, isLoading, error } = useDiagnosticSessionStats(shopId)

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-32 w-full bg-secondary dark:bg-[#2a2a2a]" />
				<Skeleton className="h-48 w-full bg-secondary dark:bg-[#2a2a2a]" />
				<Skeleton className="h-32 w-full bg-secondary dark:bg-[#2a2a2a]" />
			</div>
		)
	}

	if (error || !stats) {
		return (
			<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
				<p className="text-sm text-red-600 dark:text-red-400">
					Error loading statistics: {error instanceof Error ? error.message : 'Unknown error'}
				</p>
			</div>
		)
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}m ${secs}s`
	}

	return (
		<div className="space-y-6">
			{/* Overall Performance */}
			<div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg p-4">
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
					Overall Performance
				</h3>
				<div className="space-y-4">
					<div>
						<div className="flex items-center justify-between mb-1">
							<span className="text-xs text-gray-600 dark:text-gray-400">
								Sessions This Month
							</span>
							<div className="flex items-center gap-1">
								{stats.total_sessions_change_percent >= 0 ? (
									<TrendingUp className="w-3 h-3 text-green-500" />
								) : (
									<TrendingDown className="w-3 h-3 text-red-500" />
								)}
								<span
									className={cn(
										'text-xs font-medium',
										stats.total_sessions_change_percent >= 0
											? 'text-green-600 dark:text-green-400'
											: 'text-red-600 dark:text-red-400'
									)}
								>
									{Math.abs(stats.total_sessions_change_percent)}%
								</span>
							</div>
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{stats.total_sessions_this_month}
						</div>
					</div>

					<div>
						<div className="flex items-center justify-between mb-1">
							<span className="text-xs text-gray-600 dark:text-gray-400">
								Avg Diagnosis Time
							</span>
							<Clock className="w-3 h-3 text-gray-400" />
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{formatTime(stats.average_diagnosis_time_seconds)}
						</div>
						<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
							vs {formatTime(stats.manual_average_time_seconds)} manual
						</div>
					</div>

					<div>
						<div className="flex items-center justify-between mb-1">
							<span className="text-xs text-gray-600 dark:text-gray-400">Success Rate</span>
							<CheckCircle className="w-3 h-3 text-green-500" />
						</div>
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{stats.ai_success_rate}%
						</div>
					</div>
				</div>
			</div>

			{/* Trending Issues */}
			<div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg p-4">
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
					Top Trending Issues
				</h3>
				<div className="space-y-3">
					{stats.trending_issues.length > 0 ? (
						stats.trending_issues.map((issue, index) => (
							<div key={index} className="flex items-center justify-between">
								<div className="flex-1 min-w-0">
									<div className="text-sm font-medium text-gray-900 dark:text-white truncate">
										{issue.issue}
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										{issue.count} occurrence{issue.count !== 1 ? 's' : ''}
									</div>
								</div>
								<div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
									{issue.percentage}%
								</div>
							</div>
						))
					) : (
						<div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
							No trending issues yet
						</div>
					)}
				</div>
			</div>

			{/* System Health */}
			<div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg p-4">
				<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
					AI System Health
				</h3>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm text-gray-600 dark:text-gray-400">System Status</span>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-green-500 rounded-full"></div>
							<span className="text-sm font-medium text-gray-900 dark:text-white">
								Operational
							</span>
						</div>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
						<span className="text-sm font-medium text-gray-900 dark:text-white">
							&lt; 2s avg
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}

