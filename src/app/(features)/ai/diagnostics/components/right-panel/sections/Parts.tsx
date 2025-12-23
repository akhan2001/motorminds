'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

interface Part {
	name: string
	partNumber: string
	price: number
	availability: string
	supplier?: string
	eta?: string
	confidence?: string
}

interface PartsProps {
	parts: Part[]
}

export function Parts({ parts }: PartsProps) {
	if (parts.length === 0) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-sm text-muted-foreground text-center">No parts listed</p>
				</CardContent>
			</Card>
		)
	}

	const getAvailabilityIcon = (availability: string) => {
		const availLower = availability.toLowerCase()
		if (availLower.includes('stock') && !availLower.includes('limited')) {
			return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
		}
		return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
	}

	const getAvailabilityVariant = (availability: string) => {
		const availLower = availability.toLowerCase()
		if (availLower.includes('stock') && !availLower.includes('limited')) {
			return 'default'
		}
		return 'secondary'
	}

	return (
		<div className="space-y-3">
			{parts.map((part, idx) => (
				<Card key={part.partNumber || idx}>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm flex items-center gap-2">
							<Package className="w-4 h-4" />
							{part.name}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								{getAvailabilityIcon(part.availability)}
								<Badge variant={getAvailabilityVariant(part.availability)} className="text-xs">
									{part.availability}
								</Badge>
							</div>
							<div className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
								<DollarSign className="w-3.5 h-3.5" />
								<span>{part.price.toFixed(2)}</span>
							</div>
						</div>

						<div className="space-y-1 text-xs text-muted-foreground">
							<div className="flex items-center gap-2">
								<span className="font-medium">Part #:</span>
								<code className="font-mono">{part.partNumber}</code>
							</div>
							{part.supplier && (
								<div>
									<span className="font-medium">Supplier:</span> {part.supplier}
								</div>
							)}
							{part.eta && (
								<div className="flex items-center gap-1.5">
									<Clock className="w-3.5 h-3.5" />
									<span>ETA: {part.eta}</span>
								</div>
							)}
							{part.confidence && (
								<div>
									<span className="font-medium">Confidence:</span>{' '}
									<span className="capitalize">{part.confidence}</span>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}

