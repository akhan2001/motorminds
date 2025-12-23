'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, User, DollarSign } from 'lucide-react'

interface WorkOrder {
	id: string
	number: string
	status: string
	createdDate: string
	assignedTechnician?: string
	totalAmount?: number
	reportedIssue?: string
	lineItems?: Array<{
		description: string
		quantity: number
		price: number
	}>
}

interface WorkOrdersProps {
	workOrders: WorkOrder[]
}

export function WorkOrders({ workOrders }: WorkOrdersProps) {
	if (workOrders.length === 0) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-sm text-muted-foreground text-center">No work orders</p>
				</CardContent>
			</Card>
		)
	}

	const getStatusVariant = (status: string) => {
		const statusLower = status.toLowerCase()
		if (statusLower.includes('progress')) return 'default'
		if (statusLower.includes('pending')) return 'secondary'
		if (statusLower.includes('complete')) return 'outline'
		return 'secondary'
	}

	return (
		<div className="space-y-3">
			{workOrders.map((wo) => (
				<Card key={wo.id}>
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between gap-2">
							<div className="flex-1">
								<CardTitle className="text-base flex items-center gap-2">
									<FileText className="w-4 h-4" />
									{wo.number}
								</CardTitle>
							</div>
							<Badge variant={getStatusVariant(wo.status)} className="text-xs">
								{wo.status}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-3">
						{wo.reportedIssue && (
							<div>
								<p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
									Reported Issue
								</p>
								<p className="text-xs text-muted-foreground">{wo.reportedIssue}</p>
							</div>
						)}

						<div className="grid grid-cols-2 gap-3 text-xs">
							{wo.createdDate && (
								<div className="flex items-center gap-1.5 text-muted-foreground">
									<Calendar className="w-3.5 h-3.5" />
									<span>{wo.createdDate}</span>
								</div>
							)}
							{wo.assignedTechnician && (
								<div className="flex items-center gap-1.5 text-muted-foreground">
									<User className="w-3.5 h-3.5" />
									<span>{wo.assignedTechnician}</span>
								</div>
							)}
						</div>

						{wo.lineItems && wo.lineItems.length > 0 && (
							<div className="pt-2 border-t border-border">
								<p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
									Line Items
								</p>
								<div className="space-y-1.5">
									{wo.lineItems.map((item, idx) => (
										<div
											key={idx}
											className="flex items-center justify-between text-xs text-muted-foreground"
										>
											<span>
												{item.quantity}x {item.description}
											</span>
											<span className="font-medium">${item.price.toFixed(2)}</span>
										</div>
									))}
								</div>
							</div>
						)}

						{wo.totalAmount !== undefined && (
							<div className="pt-2 border-t border-border flex items-center justify-between">
								<div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100">
									<DollarSign className="w-3.5 h-3.5" />
									<span>Total</span>
								</div>
								<span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									${wo.totalAmount.toFixed(2)}
								</span>
							</div>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	)
}

