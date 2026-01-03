'use client'

import React from 'react'
import { DiagramImage } from './DiagramImage'
import { DiagramPDF } from './DiagramPDF'
import { Loader2, AlertCircle } from 'lucide-react'

interface DiagramViewerProps {
	baseVehicleId: number
	applicationId: number
	diagramName: string
	engineId?: number
}

export function DiagramViewer({ baseVehicleId, applicationId, diagramName, engineId }: DiagramViewerProps) {
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState<string | null>(null)
	const [diagramDetails, setDiagramDetails] = React.useState<any>(null)
	const [documentData, setDocumentData] = React.useState<{ blob: Blob; contentType: string } | null>(null)


	React.useEffect(() => {
		async function fetchDiagram() {
			try {
				setLoading(true)
				setError(null)

				// Build details URL with optional engineId
				let detailsUrl = `/api/motor-daas/wiring-diagrams/${baseVehicleId}/details/${applicationId}`
				if (engineId) {
					detailsUrl += `?engineId=${engineId}`
				}

				// Fetch diagram details
				const detailsResponse = await fetch(detailsUrl)
				
				if (!detailsResponse.ok) {
					if (detailsResponse.status === 403) {
						throw new Error('Access denied by MOTOR API. This vehicle make may not be included in the current subscription, or API credentials need to be verified.')
					}
					throw new Error(`Failed to fetch diagram details: ${detailsResponse.statusText}`)
				}

				const details = await detailsResponse.json()
				setDiagramDetails(details)

				// Extract document ID from the response structure
				// The actual structure is: details.WiringDiagrams[0].DiagramSet.Documents[0].DocumentID
				let documentId: number | null = null

				// Method 1: Check WiringDiagrams array (actual structure from API)
				if (details.WiringDiagrams && Array.isArray(details.WiringDiagrams) && details.WiringDiagrams.length > 0) {
					const wiringDiagram = details.WiringDiagrams[0]
					if (wiringDiagram.DiagramSet?.Documents && Array.isArray(wiringDiagram.DiagramSet.Documents) && wiringDiagram.DiagramSet.Documents.length > 0) {
						// Get the first active document
						const activeDoc = wiringDiagram.DiagramSet.Documents.find((doc: any) => doc.IsActive !== false) || wiringDiagram.DiagramSet.Documents[0]
						documentId = activeDoc.DocumentID
					}
				}
				// Method 2: Check Documents array (fallback)
				else if (details.Documents && Array.isArray(details.Documents) && details.Documents.length > 0) {
					documentId = details.Documents[0].DocumentID
				}
				// Method 3: Check if response is wrapped in Body
				else if (details.Body?.WiringDiagrams && Array.isArray(details.Body.WiringDiagrams) && details.Body.WiringDiagrams.length > 0) {
					const wiringDiagram = details.Body.WiringDiagrams[0]
					if (wiringDiagram.DiagramSet?.Documents && Array.isArray(wiringDiagram.DiagramSet.Documents) && wiringDiagram.DiagramSet.Documents.length > 0) {
						const activeDoc = wiringDiagram.DiagramSet.Documents.find((doc: any) => doc.IsActive !== false) || wiringDiagram.DiagramSet.Documents[0]
						documentId = activeDoc.DocumentID
					}
				}
				// Method 4: Check Body.Documents (fallback)
				else if (details.Body?.Documents && Array.isArray(details.Body.Documents) && details.Body.Documents.length > 0) {
					documentId = details.Body.Documents[0].DocumentID
				}
				// Method 5: Check Applications array (legacy format)
				else if (details.Applications && Array.isArray(details.Applications) && details.Applications.length > 0) {
					const app = details.Applications[0]
					if (app.Documents && Array.isArray(app.Documents) && app.Documents.length > 0) {
						documentId = app.Documents[0].DocumentID
					}
				}

				if (!documentId) {
					console.warn('[DiagramViewer] No document ID found. Response keys:', Object.keys(details))
					setError('No document is available for this wiring diagram from MOTOR. Try another diagram from the list.')
					return
				}

				// Fetch document
				const documentResponse = await fetch(
					`/api/motor-daas/wiring-diagrams/${baseVehicleId}/document/${documentId}`
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

	if (!documentData) {
		return null
	}

	// Determine if it's an image or PDF
	const isImage = documentData.contentType.startsWith('image/')
	const isPDF = documentData.contentType === 'application/pdf' || documentData.contentType.includes('pdf')

	const diagramContent = isImage ? (
		<DiagramImage imageBlob={documentData.blob} diagramName={diagramName} />
	) : isPDF ? (
		<DiagramPDF pdfBlob={documentData.blob} diagramName={diagramName} />
	) : (
		<DiagramImage imageBlob={documentData.blob} diagramName={diagramName} />
	)

	return (
		<div className="space-y-3">
			{/* Diagram header */}
			<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{diagramName}</h3>
			
			{/* Diagram content */}
			{diagramContent}

			</div>
	)
}


