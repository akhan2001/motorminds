'use client'

import React from 'react'
import { Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DiagramPDFProps {
	pdfBlob: Blob
	diagramName: string
}

export function DiagramPDF({ pdfBlob, diagramName }: DiagramPDFProps) {
	const [pdfUrl, setPdfUrl] = React.useState<string | null>(null)
	const [isLoading, setIsLoading] = React.useState(true)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		// Create object URL from blob
		const url = URL.createObjectURL(pdfBlob)
		setPdfUrl(url)
		setIsLoading(false)

		// Cleanup: revoke object URL when component unmounts
		return () => {
			URL.revokeObjectURL(url)
		}
	}, [pdfBlob])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
				<Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
				<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
			</div>
		)
	}

	if (!pdfUrl) {
		return null
	}

	return (
		<div className="w-full max-w-full min-w-0 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
			<div className="p-3 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a] flex items-center justify-between gap-2 min-w-0">
				<div className="flex items-center gap-2 min-w-0 flex-1">
					<FileText className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
					<p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words overflow-wrap-anywhere min-w-0">{diagramName}</p>
				</div>
				<Button
					size="sm"
					variant="outline"
					className="flex-shrink-0"
					onClick={() => {
						window.open(pdfUrl, '_blank')
					}}
				>
					Open in New Tab
				</Button>
			</div>
			<div className="p-4 w-full min-w-0 overflow-hidden">
				<iframe
					src={pdfUrl}
					className="w-full max-w-full h-[600px] rounded border border-gray-200 dark:border-[#2a2a2a] min-w-0"
					title={diagramName}
					onError={() => setError('Failed to load PDF')}
				/>
			</div>
		</div>
	)
}


