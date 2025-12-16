'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

interface DiagramImageProps {
	imageBlob: Blob
	diagramName: string
}

export function DiagramImage({ imageBlob, diagramName }: DiagramImageProps) {
	const [imageUrl, setImageUrl] = React.useState<string | null>(null)
	const [isLoading, setIsLoading] = React.useState(true)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		// Create object URL from blob
		const url = URL.createObjectURL(imageBlob)
		setImageUrl(url)
		setIsLoading(false)

		// Cleanup: revoke object URL when component unmounts
		return () => {
			URL.revokeObjectURL(url)
		}
	}, [imageBlob])

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

	if (!imageUrl) {
		return null
	}

	return (
		<div className="w-full bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
			<div className="p-3 border-b border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a]">
				<p className="text-sm font-medium text-gray-900 dark:text-gray-100">{diagramName}</p>
			</div>
			<div className="p-4 overflow-auto max-h-[600px] flex items-center justify-center">
				<img
					src={imageUrl}
					alt={diagramName}
					className="max-w-full h-auto rounded"
					onError={() => setError('Failed to load diagram image')}
					onLoad={() => setIsLoading(false)}
				/>
			</div>
		</div>
	)
}
