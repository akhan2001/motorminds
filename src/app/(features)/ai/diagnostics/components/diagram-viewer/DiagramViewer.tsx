'use client'

import React from 'react'
import { DocumentImage } from '../elements/DocumentImage'
import { DiagramPDF } from './DiagramPDF'
import { Loader2, AlertCircle } from 'lucide-react'

interface DiagramViewerProps {
	baseVehicleId: number
	applicationId: number
	diagramName: string
	engineId?: number
}

/**
 * Displays a wiring diagram by fetching details and rendering the document
 * Uses the shared DocumentImage component for consistency with service procedures
 */
export function DiagramViewer({ baseVehicleId, applicationId, diagramName, engineId }: DiagramViewerProps) {
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState<string | null>(null)
	const [documentId, setDocumentId] = React.useState<number | null>(null)
	const [isPDF, setIsPDF] = React.useState(false)
	const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null)

	React.useEffect(() => {
		async function fetchDiagramDetails() {
			try {
				setLoading(true)
				setError(null)
				setDocumentId(null)
				setIsPDF(false)
				setPdfBlob(null)

				// Build details URL with optional engineId
				let detailsUrl = `/api/motor-daas/wiring-diagrams/${baseVehicleId}/details/${applicationId}`
				if (engineId) {
					detailsUrl += `?engineId=${engineId}`
				}

				// Fetch diagram details to get document ID
				const detailsResponse = await fetch(detailsUrl)
				
				if (!detailsResponse.ok) {
					if (detailsResponse.status === 403) {
						throw new Error('Access denied. This vehicle make may not be included in the subscription.')
					}
					throw new Error(`Failed to fetch diagram details: ${detailsResponse.statusText}`)
				}

				const details = await detailsResponse.json()

				// Extract document ID from the response structure
				let docId: number | null = null
				let format = 'image'

				// Method 1: Check WiringDiagrams array
				if (details.WiringDiagrams?.[0]?.DiagramSet?.Documents?.length > 0) {
					const docs = details.WiringDiagrams[0].DiagramSet.Documents
					const activeDoc = docs.find((doc: any) => doc.IsActive !== false) || docs[0]
					docId = activeDoc.DocumentID
					format = activeDoc.Format || 'image'
				}
				// Method 2: Check Documents array
				else if (details.Documents?.length > 0) {
					docId = details.Documents[0].DocumentID
					format = details.Documents[0].Format || 'image'
				}
				// Method 3: Body wrapper
				else if (details.Body?.WiringDiagrams?.[0]?.DiagramSet?.Documents?.length > 0) {
					const docs = details.Body.WiringDiagrams[0].DiagramSet.Documents
					const activeDoc = docs.find((doc: any) => doc.IsActive !== false) || docs[0]
					docId = activeDoc.DocumentID
					format = activeDoc.Format || 'image'
				}
				// Method 4: Applications array
				else if (details.Applications?.[0]?.Documents?.length > 0) {
					docId = details.Applications[0].Documents[0].DocumentID
					format = details.Applications[0].Documents[0].Format || 'image'
				}

				if (!docId) {
					setError('No document available for this wiring diagram. Try another diagram.')
					return
				}

				// Check if PDF
				const isPdfFormat = format.toLowerCase().includes('pdf')
				setIsPDF(isPdfFormat)

				if (isPdfFormat) {
					// For PDFs, we need to fetch the blob
					const docResponse = await fetch(
						`/api/motor-daas/wiring-diagrams/${baseVehicleId}/document/${docId}`
					)
					if (!docResponse.ok) {
						throw new Error(`Failed to fetch PDF: ${docResponse.statusText}`)
					}
					const blob = await docResponse.blob()
					setPdfBlob(blob)
				}

				setDocumentId(docId)
			} catch (err) {
				console.error('[DiagramViewer] Error:', err)
				setError(err instanceof Error ? err.message : 'Failed to load diagram')
			} finally {
				setLoading(false)
			}
		}

		fetchDiagramDetails()
	}, [baseVehicleId, applicationId, engineId])

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

	if (!documentId) {
		return null
	}

	// Render PDF or Image
	if (isPDF && pdfBlob) {
		return (
			<div className="space-y-3">
				<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{diagramName}</h3>
				<DiagramPDF pdfBlob={pdfBlob} diagramName={diagramName} />
			</div>
		)
	}

	// Use shared DocumentImage component for images
	const imageUrl = `/api/motor-daas/wiring-diagrams/${baseVehicleId}/document/${documentId}`

	return (
		<DocumentImage
			src={imageUrl}
			alt={diagramName}
			title={diagramName}
			showHeader={true}
			maxHeight={700}
		/>
	)
}
