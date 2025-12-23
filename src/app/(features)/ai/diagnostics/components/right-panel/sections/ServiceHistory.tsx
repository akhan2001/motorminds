'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, FileText, DollarSign, Wrench } from 'lucide-react'

interface ServiceHistoryItem {
	date: string
	type: string
	description: string
	technician?: string
	invoiceNumber?: string
	amount?: number
	attachments?: string[]
}

interface ServiceHistoryProps {
	serviceHistory: ServiceHistoryItem[]
}

export function ServiceHistory({ serviceHistory }: ServiceHistoryProps) {
	if (serviceHistory.length === 0) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-sm text-muted-foreground text-center">No service history</p>
				</CardContent>
			</Card>
		)
	}

	const getTypeVariant = (type: string) => {
		const typeLower = type.toLowerCase()
		if (typeLower.includes('repair')) return 'destructive'
		if (typeLower.includes('maintenance')) return 'default'
		return 'secondary'
	}

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="space-y-4">
					{serviceHistory.map((item, idx) => (
						<div
							key={idx}
							className={idx !== serviceHistory.length - 1 ? 'pb-4 border-b border-border' : ''}
						>
							<div className="flex items-start justify-between gap-2 mb-2">
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<Badge variant={getTypeVariant(item.type)} className="text-xs">
											{item.type}
										</Badge>
										{item.invoiceNumber && (
											<span className="text-xs text-muted-foreground font-mono">
												{item.invoiceNumber}
											</span>
										)}
									</div>
									<p className="text-sm text-gray-900 dark:text-gray-100">{item.description}</p>
								</div>
								{item.amount !== undefined && (
									<div className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
										<DollarSign className="w-3.5 h-3.5" />
										<span>{item.amount.toFixed(2)}</span>
									</div>
								)}
							</div>

							<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
								<div className="flex items-center gap-1.5">
									<Calendar className="w-3.5 h-3.5" />
									<span>{item.date}</span>
								</div>
								{item.technician && (
									<div className="flex items-center gap-1.5">
										<User className="w-3.5 h-3.5" />
										<span>{item.technician}</span>
									</div>
								)}
								{item.attachments && item.attachments.length > 0 && (
									<div className="flex items-center gap-1.5">
										<FileText className="w-3.5 h-3.5" />
										<span>{item.attachments.length} attachment(s)</span>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}

