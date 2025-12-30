'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { SessionCard } from './SessionCard'
import { useDiagnosticSessions } from '../../hooks/use-diagnostic-sessions'
import type { DiagnosticSessionStatus } from '../../types/diagnostic-session'
import { Inbox } from 'lucide-react'

export type SessionFilterTab = 'active' | 'pending_review' | 'recent' | 'completed'

interface SessionListProps {
	shopId: string
	activeTab: SessionFilterTab
	searchQuery: string
}

export function SessionList({ shopId, activeTab, searchQuery }: SessionListProps) {
	// Map tab to status filter
	const getStatusFilter = (tab: SessionFilterTab): DiagnosticSessionStatus | undefined => {
		if (tab === 'active') return 'active'
		if (tab === 'pending_review') return 'pending_review'
		if (tab === 'completed') return 'completed'
		return undefined // 'recent' shows all
	}

	const statusFilter = getStatusFilter(activeTab)
	const filters = {
		...(statusFilter && { status: statusFilter }),
		...(searchQuery && { search: searchQuery }),
		limit: 100,
		offset: 0,
	}

	const { data: sessions, isLoading, error } = useDiagnosticSessions(shopId, filters)

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{[...Array(6)].map((_, i) => (
					<Skeleton
						key={i}
						className="h-64 w-full bg-secondary dark:bg-[#2a2a2a] rounded-lg"
					/>
				))}
			</div>
		)
	}

	if (error) {
		return (
			<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
				<p className="text-red-600 dark:text-red-400">
					Error loading sessions: {error instanceof Error ? error.message : 'Unknown error'}
				</p>
			</div>
		)
	}

	if (!sessions || sessions.length === 0) {
		return (
			<div className="bg-card border border-border rounded-lg p-12 text-center">
				<Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
				<h3 className="text-lg font-medium text-foreground mb-2">
					{searchQuery ? 'No sessions found' : 'No diagnostic sessions yet'}
				</h3>
				<p className="text-sm text-muted-foreground">
					{searchQuery
						? 'Try adjusting your search terms or filters'
						: 'Create your first diagnostic session to get started'}
				</p>
			</div>
		)
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{sessions.map((session) => (
				<SessionCard key={session.id} session={session} />
			))}
		</div>
	)
}

