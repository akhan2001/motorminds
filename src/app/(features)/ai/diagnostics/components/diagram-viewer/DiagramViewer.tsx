'use client'

import React from 'react'
import { DiagramImage } from './DiagramImage'
import { DiagramPDF } from './DiagramPDF'
import { Loader2, AlertCircle } from 'lucide-react'

interface DiagramViewerProps {
	baseVehicleId: number
	applicationId: number
	diagramName: string
}

export function DiagramViewer({ baseVehicleId, applicationId, diagramName }: DiagramViewerProps) {
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState<string | null>(null)
	const [diagramDetails, setDiagramDetails] = React.useState<any>(null)
	const [documentData, setDocumentData] = React.useState<{ blob: Blob; contentType: string } | null>(null)

	React.useEffect(() => {
		async function fetchDiagram() {
			try {
				setLoading(true)
				setError(null)

				// Fetch diagram details
				const detailsResponse = await fetch(
					`/api/motor-daas/wiring-diagrams/${baseVehicleId}/details/${applicationId}`
				)
				
				if (!detailsResponse.ok) {
					throw new Error(`Failed to fetch diagram details: ${detailsResponse.statusText}`)
				}

				const details = await detailsResponse.json()
				setDiagramDetails(details)

				// Get first document
				const document = details.Documents?.[0]
				if (!document || !document.DocumentID) {
					console.warn('[DiagramViewer] No document found for this diagram details response:', details)
					setError('No document is available for this wiring diagram from MOTOR. Try another diagram from the list.')
					return
				}

				// Fetch document
				const documentResponse = await fetch(
					`/api/motor-daas/wiring-diagrams/${baseVehicleId}/document/${document.DocumentID}`
				)

				if (!documentResponse.ok) {
					throw new Error(`Failed to fetch diagram document: ${documentResponse.statusText}`)
				}

				const blob = await documentResponse.blob()
				const contentType = documentResponse.headers.get('content-type') || 'application/octet-stream'

				setDocumentData({ blob, contentType })
			} catch (err) {
				console.error('[DiagramViewer] Error:', err)
				setError(err instanceof Error ? err.message : 'Failed to load diagram')
			} finally {
				setLoading(false)
			}
		}

		fetchDiagram()
	}, [baseVehicleId, applicationId])

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
				<Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400 mr-2" />
				<span className="text-sm text-gray-600 dark:text-gray-400">Loading diagram...</span>
			</div>
		)
	}

	if (error) {
		return (
			<div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
				<div className="flex items-center gap-2">
					<AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				</div>
			</div>
		)
	}

	if (!documentData) {
		return null
	}

	// Determine if it's an image or PDF
	const isImage = documentData.contentType.startsWith('image/')
	const isPDF = documentData.contentType === 'application/pdf' || documentData.contentType.includes('pdf')

	if (isImage) {
		return <DiagramImage imageBlob={documentData.blob} diagramName={diagramName} />
	}

	if (isPDF) {
		return <DiagramPDF pdfBlob={documentData.blob} diagramName={diagramName} />
	}

	// Fallback: try to display as image anyway
	return <DiagramImage imageBlob={documentData.blob} diagramName={diagramName} />
}


