'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle2 } from 'lucide-react'

interface Diagram {
	id: number
	type: string
	title: string
	description?: string
	available?: boolean
}

interface DiagramsProps {
	diagrams: Diagram[]
}

export function Diagrams({ diagrams }: DiagramsProps) {
	if (diagrams.length === 0) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-sm text-muted-foreground text-center">No diagrams available</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base flex items-center gap-2">
					<FileText className="w-4 h-4" />
					Available Diagrams ({diagrams.length})
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{diagrams.map((diagram) => (
					<div
						key={diagram.id}
						className="p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors"
					>
						<div className="flex items-start justify-between gap-2 mb-1">
							<div className="flex-1">
								<h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
									{diagram.title}
								</h4>
								{diagram.description && (
									<p className="text-xs text-muted-foreground mt-0.5">{diagram.description}</p>
								)}
							</div>
							{diagram.available !== false && (
								<CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
							)}
						</div>
						<div className="mt-2">
							<Badge variant="outline" className="text-xs">
								{diagram.type}
							</Badge>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	)
}

