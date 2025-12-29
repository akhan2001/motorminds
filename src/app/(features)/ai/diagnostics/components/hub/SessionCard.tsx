'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Car, User, Phone, MessageSquare, FileText } from 'lucide-react'
import type { DiagnosticSession } from '../../types/diagnostic-session'
import { cn } from '@/lib/utils'

interface SessionCardProps {
	session: DiagnosticSession
}

export function SessionCard({ session }: SessionCardProps) {
	const vehicle = session.vehicle_context
	const statusColors = {
		active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
		pending_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
		completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
		archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
	}

	const formatTimeAgo = (dateString: string) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		const diffMins = Math.floor(diffMs / 60000)
		const diffHours = Math.floor(diffMs / 3600000)
		const diffDays = Math.floor(diffMs / 86400000)

		if (diffMins < 1) return 'Just now'
		if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
		if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
		if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
		return date.toLocaleDateString()
	}

	return (
		<div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
			{/* Header */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						{session.work_order_id && (
							<span className="text-sm font-medium text-gray-900 dark:text-white">
								{session.work_order_id}
							</span>
						)}
						<Badge
							className={cn(
								'text-xs',
								statusColors[session.status] || statusColors.active
							)}
						>
							{session.status === 'pending_review'
								? 'Pending Review'
								: session.status.charAt(0).toUpperCase() + session.status.slice(1)}
						</Badge>
					</div>
				</div>
			</div>

			{/* Vehicle Info */}
			<div className="mb-3">
				<div className="flex items-center gap-2 mb-1">
					<Car className="w-4 h-4 text-gray-500 dark:text-gray-400" />
					<span className="text-sm font-medium text-gray-900 dark:text-white">
						{vehicle.year} {vehicle.make} {vehicle.model}
					</span>
				</div>
				{vehicle.vin && (
					<div className="text-xs text-gray-500 dark:text-gray-400 ml-6">
						VIN: {vehicle.vin.slice(-8)}
					</div>
				)}
			</div>

			{/* Initial Issue */}
			{session.initial_issue && (
				<div className="mb-2">
					<div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
						Initial Issue:
					</div>
					<div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
						{session.initial_issue}
					</div>
				</div>
			)}

			{/* AI Recommendation */}
			{session.ai_recommendation && (
				<div className="mb-2">
					<div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
						AI Recommendation:
					</div>
					<div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 italic">
						{session.ai_recommendation}
					</div>
				</div>
			)}

			{/* Last Activity */}
			<div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
				Last Activity: {formatTimeAgo(session.last_activity_at)}
			</div>

			{/* Actions */}
			<div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
				<Link href={`/ai/diagnostics/${session.session_id}`} className="flex-1">
					<Button
						variant="default"
						size="sm"
						className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
					>
						<MessageSquare className="w-4 h-4 mr-2" />
						Open Chat
					</Button>
				</Link>
				<Button
					variant="outline"
					size="sm"
					className="flex-shrink-0 border-gray-300 dark:border-gray-700"
					disabled
				>
					<FileText className="w-4 h-4" />
				</Button>
			</div>
		</div>
	)
}

