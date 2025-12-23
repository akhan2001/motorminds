'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Calendar } from 'lucide-react'

interface DTCCode {
	code: string
	description: string
	severity?: string
	detectedDate?: string
	aiSummary?: string
}

interface DTCCodesProps {
	dtcCodes: DTCCode[]
	detailed?: boolean
}

export function DTCCodes({ dtcCodes, detailed = false }: DTCCodesProps) {
	if (dtcCodes.length === 0) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-sm text-muted-foreground text-center">No active DTC codes</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base flex items-center gap-2">
					<AlertTriangle className="w-4 h-4 text-amber-500" />
					Active DTC Codes ({dtcCodes.length})
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{dtcCodes.map((dtc, idx) => (
					<div
						key={dtc.code || idx}
						className="p-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]"
					>
						<div className="flex items-start justify-between gap-2 mb-2">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<code className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
										{dtc.code}
									</code>
									{dtc.severity && (
										<Badge
											variant={dtc.severity === 'Critical' ? 'destructive' : 'secondary'}
											className="text-xs"
										>
											{dtc.severity}
										</Badge>
									)}
								</div>
								<p className="text-xs text-muted-foreground">{dtc.description}</p>
							</div>
						</div>

						{detailed && dtc.detectedDate && (
							<div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
								<Calendar className="w-3 h-3" />
								<span>Detected: {dtc.detectedDate}</span>
							</div>
						)}

						{detailed && dtc.aiSummary && (
							<div className="mt-2 pt-2 border-t border-border">
								<p className="text-xs text-muted-foreground leading-relaxed">
									<strong className="text-gray-700 dark:text-gray-300">AI Summary:</strong>{' '}
									{dtc.aiSummary}
								</p>
							</div>
						)}
					</div>
				))}
			</CardContent>
		</Card>
	)
}

