/**
 * Supabase-style Motor DaaS Tools
 * 
 * Stateless tools following Supabase patterns:
 * - No caching in tools (stateless)
 * - Simple try/catch error handling
 * - Return error strings, not complex objects
 * - Context passed via closure (dependency injection)
 * - Clear tool descriptions for AI guidance
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { MotorDaasClient } from '@/lib/integrations/motor-daas/client'
import { extractDiagramName } from '@/lib/integrations/motor-daas/wiring-diagrams.utils'

/**
 * Known subject categories for wiring diagrams (from MOTOR DaaS API)
 */
const WIRING_DIAGRAM_SUBJECTS = [
	'body & accessories',
	'brakes',
	'electrical distribution',
	'engine',
	'hvac',
	'interior & driver amenity',
	'interior switch',
	'lighting',
	'restraints',
	'steering',
	'transmission/transaxle',
	'warning systems',
]

/**
 * Detect if query is a subject category (browse mode) or component search
 */
function detectWiringDiagramMode(query: string): 'browse' | 'search' {
	const normalized = query.toLowerCase().trim()
	
	// Check if query matches a known subject
	const matchingSubject = WIRING_DIAGRAM_SUBJECTS.find(subject => 
		normalized.includes(subject) || subject.includes(normalized)
	)
	
	return matchingSubject ? 'browse' : 'search'
}

/**
 * Find matching subject in taxonomy response
 */
function findMatchingSubject(
	subjects: Array<{ ID: number; Name: string }>,
	query: string
): { ID: number; Name: string } | null {
	const normalized = query.toLowerCase().trim()
	
	return subjects.find(s => 
		s.Name.toLowerCase().includes(normalized) ||
		normalized.includes(s.Name.toLowerCase())
	) || null
}

/**
 * Format diagram response for AI context
 */
function formatDiagramResponse(
	applications: Array<any>,
	metadata: { mode: 'browse' | 'search'; subject?: string; subjectId?: number; searchTerm?: string }
) {
	const diagrams = applications.map(app => ({
		id: app.ApplicationID,
		name: extractDiagramName(app),
		documentCount: app.Item?.DocumentCount || 0,
		subjects: app.SAESubjects?.map((s: any) => s.Name) || [],
		systems: app.SAESubjects?.flatMap((s: any) => 
			s.Systems?.filter((sys: any) => sys.IsActive)?.map((sys: any) => sys.Name) || []
		) || [],
		href: app.Links?.find((l: any) => l.Rel === 'Self')?.Href,
	}))

	return {
		success: true,
		...metadata,
		diagrams,
		totalCount: diagrams.length,
	}
}

/**
 * Format component response for AI context
 */
function formatComponentResponse(
	applications: Array<any>,
	metadata?: { searchTerm?: string }
) {
	const components = applications.map(app => ({
		id: app.ApplicationID,
		name: app.DisplayName || `Component ${app.ApplicationID}`,
		description: app.Description,
		partNumber: app.PartNumber,
		partNumbers: app.PartNumbers,
		href: app.Links?.find((l: any) => l.Rel === 'Self')?.Href,
	}))

	return {
		success: true,
		components,
		totalCount: components.length,
		...(metadata?.searchTerm && { searchTerm: metadata.searchTerm }),
	}
}

/**
 * Extract document ID from wiring diagram details response
 */
function extractDocumentId(details: any): number | null {
	// Method 1: Check WiringDiagrams array (actual structure from API)
	if (details.WiringDiagrams && Array.isArray(details.WiringDiagrams) && details.WiringDiagrams.length > 0) {
		const wiringDiagram = details.WiringDiagrams[0]
		if (wiringDiagram.DiagramSet?.Documents && Array.isArray(wiringDiagram.DiagramSet.Documents) && wiringDiagram.DiagramSet.Documents.length > 0) {
			const activeDoc = wiringDiagram.DiagramSet.Documents.find((doc: any) => doc.IsActive !== false) || wiringDiagram.DiagramSet.Documents[0]
			return activeDoc.DocumentID
		}
	}
	
	// Method 2: Check Documents array (fallback)
	if (details.Documents && Array.isArray(details.Documents) && details.Documents.length > 0) {
		return details.Documents[0].DocumentID
	}
	
	// Method 3: Check Applications array (legacy format)
	if (details.Applications && Array.isArray(details.Applications) && details.Applications.length > 0) {
		const app = details.Applications[0]
		if (app.Documents && Array.isArray(app.Documents) && app.Documents.length > 0) {
			return app.Documents[0].DocumentID
		}
	}
	
	return null
}

/**
 * Get document list from wiring diagram details response
 */
function extractDocumentList(details: any): Array<{ id: number; name: string; format: string; sequence: number }> {
	let documents: Array<any> = []
	
	// Check WiringDiagrams array (actual structure from API)
	if (details.WiringDiagrams && Array.isArray(details.WiringDiagrams) && details.WiringDiagrams.length > 0) {
		const wiringDiagram = details.WiringDiagrams[0]
		if (wiringDiagram.DiagramSet?.Documents && Array.isArray(wiringDiagram.DiagramSet.Documents)) {
			documents = wiringDiagram.DiagramSet.Documents
		}
	}
	// Fallback: Check Documents array
	else if (details.Documents && Array.isArray(details.Documents)) {
		documents = details.Documents
	}
	
	return documents
		.filter((doc: any) => doc.IsActive !== false)
		.map((doc: any) => ({
			id: doc.DocumentID,
			name: doc.Name || doc.Caption || `Document ${doc.DocumentID}`,
			format: doc.Format || 'unknown',
			sequence: doc.Sequence || 0,
		}))
}

export type MotorToolsContext = {
	baseVehicleId: number
	engineId?: number
	motorClient: MotorDaasClient
}

/**
 * Create Motor DaaS tools with context injected via closure
 * Following Supabase's stateless tool pattern
 */
export const getMotorTools = ({
	baseVehicleId,
	engineId,
	motorClient,
}: MotorToolsContext) => ({

	/**
	 * Wiring Diagrams Tool
	 * 
	 * Auto-detects browse vs search mode:
	 * - Browse mode: Query matches a subject category (e.g., "engine", "brakes")
	 * - Search mode: Query is a component name (e.g., "O2 sensor", "fuel pump")
	 */
	getWiringDiagrams: tool({
		description: `Search and retrieve wiring diagrams for the vehicle.

		Use this when the user asks for:
		- "wiring diagram", "electrical schematic", "circuit diagram"
		- "show wiring for [component/subject]"

		The tool automatically detects if the query is:
		- A subject category (like "engine", "brakes", "electrical") → Browse mode
		- A component search (like "O2 sensor", "fuel pump") → Search mode

		Returns a list of diagrams with IDs, names, and document counts.
		The frontend will automatically display diagrams when you return results.`,

		inputSchema: z.object({
			query: z.string().describe('Subject category (e.g., "Engine", "Brakes") or component name (e.g., "O2 sensor")'),
			mode: z.enum(['auto', 'browse', 'search']).optional().default('auto').describe('Force a mode or use auto-detection'),
		}),

		execute: async ({ query, mode = 'auto' }) => {
			try {
				// Debug: Log context values
				console.log('[getWiringDiagrams] Context:', { baseVehicleId, engineId, query, mode })
				
				// Determine execution mode
				const executionMode = mode === 'auto' 
					? detectWiringDiagramMode(query)
					: mode
				
				console.log('[getWiringDiagrams] Execution mode:', executionMode)

				if (executionMode === 'browse') {
					// Try taxonomy first (with fallback to search)
					try {
						console.log('[getWiringDiagrams] Fetching taxonomy for baseVehicleId:', baseVehicleId)
						const taxonomy = await motorClient.getWiringDiagramsTaxonomy(baseVehicleId, {
							engineId,
							resultType: 'DrillDown',
						})
						
						console.log('[getWiringDiagrams] Taxonomy result:', { 
							hasSubjects: !!taxonomy?.Subjects,
							subjectCount: taxonomy?.Subjects?.length || 0,
							subjects: taxonomy?.Subjects?.map(s => s.Name) || []
						})

						if (taxonomy?.Subjects?.length > 0) {
							const subject = findMatchingSubject(taxonomy.Subjects, query)
							console.log('[getWiringDiagrams] Matched subject:', subject)
							
							if (subject) {
								console.log('[getWiringDiagrams] Fetching summary for subject:', subject.ID)
								const summary = await motorClient.getWiringDiagramsSummary(baseVehicleId, {
									subjectId: subject.ID,
									engineId,
									pageIndex: 0,
									itemsPerPage: 30,
								})
								
								console.log('[getWiringDiagrams] Summary result:', {
									applicationCount: summary?.Applications?.length || 0
								})

								return formatDiagramResponse(summary.Applications, {
									mode: 'browse',
									subject: subject.Name,
									subjectId: subject.ID,
								})
							}
							
							// Subject not found in taxonomy
							return {
								success: false,
								error: `Subject "${query}" not found. Available subjects: ${taxonomy.Subjects.map(s => s.Name).join(', ')}`,
								mode: 'browse',
							}
						}
						
						console.log('[getWiringDiagrams] Taxonomy empty, falling back to search')
					} catch (taxonomyError) {
						// Fall through to search mode
						console.warn('[getWiringDiagrams] Taxonomy failed, using search mode:', taxonomyError)
					}
				}

				// Search mode (or fallback from browse)
				console.log('[getWiringDiagrams] Using search mode for:', query)
				const summary = await motorClient.getWiringDiagramsSummary(baseVehicleId, {
					searchTerm: query,
					engineId,
					pageIndex: 0,
					itemsPerPage: 30,
				})
				
				console.log('[getWiringDiagrams] Search result:', {
					applicationCount: summary?.Applications?.length || 0
				})

				return formatDiagramResponse(summary.Applications, {
					mode: 'search',
					searchTerm: query,
				})
			} catch (error) {
				console.error('[getWiringDiagrams] Error:', error)
				return `Failed to fetch wiring diagrams: ${error instanceof Error ? error.message : 'Unknown error'}`
			}
		},
	}),

	/**
	 * Diagram Components Tool
	 * 
	 * Gets detailed OEM component list for a specific wiring diagram.
	 * Can auto-fetch documentId if not provided.
	 */
	getDiagramDetails: tool({
		description: `Get details and document list for a wiring diagram.

		Use this when the user:
		- Wants to see what's in a specific diagram
		- Needs document IDs for a diagram
		- Asks "what documents are in diagram [X]?"

		Requires applicationId from a previous getWiringDiagrams call.
		Returns list of documents with their IDs and formats.`,

		inputSchema: z.object({
			applicationId: z.number().describe('Application ID from wiring diagram'),
		}),

		execute: async ({ applicationId }) => {
			try {
				const details = await motorClient.getWiringDiagramDetails(baseVehicleId, applicationId, engineId)
				const documents = extractDocumentList(details)

				return {
					success: true,
					applicationId,
					documents,
					totalDocuments: documents.length,
				}
			} catch (error) {
				console.error('[getDiagramDetails] Error:', error)
				return `Failed to fetch diagram details: ${error instanceof Error ? error.message : 'Unknown error'}`
			}
		},
	}),

	/**
	 * Diagram Components Tool
	 * 
	 * Gets detailed OEM component list for a specific wiring diagram document.
	 */
	getDiagramComponents: tool({
		description: `Get detailed OEM component list for a wiring diagram document.

		Use this when the user asks:
		- "what components are in diagram [X]?"
		- "show me parts for diagram [applicationId]"
		- "what parts are in document [documentId]?"

		Requires applicationId. If documentId is not provided, uses the first document.
		Returns detailed component information including part numbers, locations, wire colors.`,

		inputSchema: z.object({
			applicationId: z.number().describe('Application ID from wiring diagram'),
			documentId: z.number().optional().describe('Document ID (uses first document if not provided)'),
		}),

		execute: async ({ applicationId, documentId }) => {
			try {
				// Get documentId if not provided
				let finalDocumentId = documentId
				
				if (!finalDocumentId) {
					const details = await motorClient.getWiringDiagramDetails(baseVehicleId, applicationId, engineId)
					finalDocumentId = extractDocumentId(details)
					
					if (!finalDocumentId) {
						return {
							success: false,
							error: 'No documents found for this wiring diagram',
						}
					}
				}

				// Get OEM components for the document
				const componentDetails = await motorClient.getOEMComponentsDetailListByApplicationAndDocument(
					baseVehicleId,
					'WiringDiagrams',
					applicationId,
					finalDocumentId
				)

				const components = (componentDetails.Components || []).map(comp => ({
					id: comp.ComponentID,
					name: comp.DisplayName,
					description: comp.Description,
					partNumber: comp.PartNumber,
					partNumbers: comp.PartNumbers,
					location: comp.Location,
					connectorId: comp.ConnectorID,
					pinNumber: comp.PinNumber,
					wireColor: comp.WireColor,
					wireGauge: comp.WireGauge,
					notes: comp.Notes,
				}))

				return {
					success: true,
					applicationId,
					documentId: finalDocumentId,
					components,
					totalCount: components.length,
				}
			} catch (error) {
				console.error('[getDiagramComponents] Error:', error)
				return `Failed to fetch diagram components: ${error instanceof Error ? error.message : 'Unknown error'}`
			}
		},
	}),

	/**
	 * OEM Components Tool
	 * 
	 * Search for OEM components by name or part number.
	 */
	getOEMComponents: tool({
		description: `Search for OEM components by name or part number.

		Use this when the user asks:
		- "find components for [part name]"
		- "search for [component]"
		- "what parts are available for [component]?"

		Returns a list of OEM components with IDs, names, and part numbers.`,

		inputSchema: z.object({
			searchTerm: z.string().optional().describe('Component name or part number to search for'),
			pageIndex: z.number().optional().default(0).describe('Page index for pagination'),
			itemsPerPage: z.number().optional().default(30).describe('Items per page'),
		}),

		execute: async ({ searchTerm, pageIndex = 0, itemsPerPage = 30 }) => {
			try {
				const summary = await motorClient.getOEMComponentsSummary(baseVehicleId, {
					engineId,
					searchTerm,
					pageIndex,
					itemsPerPage,
				})

				return formatComponentResponse(summary.Applications, { searchTerm })
			} catch (error) {
				console.error('[getOEMComponents] Error:', error)
				return `Failed to fetch OEM components: ${error instanceof Error ? error.message : 'Unknown error'}`
			}
		},
	}),

	/**
	 * Related Wiring Diagrams Tool
	 * 
	 * Find wiring diagrams related to specific content.
	 */
	getRelatedWiringDiagrams: tool({
		description: `Find wiring diagrams related to a specific component or procedure.

		Use this when the user:
		- Is viewing content and asks for related wiring diagrams
		- Says "show me wiring diagrams for this component"

		Requires contentType and applicationId from previous tool calls.`,

		inputSchema: z.object({
			contentType: z.string().describe('Content type (e.g., "OEMComponents", "ServiceProcedures")'),
			applicationId: z.number().describe('Application ID of the related content'),
			pageIndex: z.number().optional().default(0),
			itemsPerPage: z.number().optional().default(30),
		}),

		execute: async ({ contentType, applicationId, pageIndex = 0, itemsPerPage = 30 }) => {
			try {
				const summary = await motorClient.getWiringDiagramsSummaryWithRelation(
					baseVehicleId,
					contentType,
					applicationId,
					{
						engineId,
						pageIndex,
						itemsPerPage,
					}
				)

				const diagrams = summary.Applications.map(app => ({
					id: app.ApplicationID,
					name: extractDiagramName(app),
					href: app.Links?.find((l: any) => l.Rel === 'Self')?.Href,
				}))

				return {
					success: true,
					contentType,
					relatedToApplicationId: applicationId,
					diagrams,
					totalCount: diagrams.length,
				}
			} catch (error) {
				console.error('[getRelatedWiringDiagrams] Error:', error)
				return `Failed to fetch related wiring diagrams: ${error instanceof Error ? error.message : 'Unknown error'}`
			}
		},
	}),

	/**
	 * Related OEM Components Tool
	 * 
	 * Get OEM components related to a wiring diagram or other content.
	 */
	getRelatedOEMComponents: tool({
		description: `Get OEM components related to a wiring diagram or other content.

		Use this when the user:
		- Is viewing a diagram and asks for related components
		- Says "what components are used in this diagram?"

		Requires contentType and applicationId from previous tool calls.`,

		inputSchema: z.object({
			contentType: z.string().describe('Content type (e.g., "WiringDiagrams")'),
			applicationId: z.number().describe('Application ID of the content'),
			pageIndex: z.number().optional().default(0),
			itemsPerPage: z.number().optional().default(30),
		}),

		execute: async ({ contentType, applicationId, pageIndex = 0, itemsPerPage = 30 }) => {
			try {
				const summary = await motorClient.getOEMComponentsSummaryWithRelation(
					baseVehicleId,
					contentType,
					applicationId,
					{
						engineId,
						pageIndex,
						itemsPerPage,
					}
				)

				const components = summary.Applications.map(app => ({
					id: app.ApplicationID,
					name: app.DisplayName || `Component ${app.ApplicationID}`,
					description: app.Description,
					partNumber: app.PartNumber,
					partNumbers: app.PartNumbers,
					href: app.Links?.find((l: any) => l.Rel === 'Self')?.Href,
				}))

				return {
					success: true,
					contentType,
					relatedToApplicationId: applicationId,
					components,
					totalCount: components.length,
				}
			} catch (error) {
				console.error('[getRelatedOEMComponents] Error:', error)
				return `Failed to fetch related OEM components: ${error instanceof Error ? error.message : 'Unknown error'}`
			}
		},
	}),

	/**
	 * Hello World Tool (for testing)
	 */
	helloWorld: tool({
		description: 'Test connection to MOTOR DaaS API. Use when the user asks to test or verify the API connection.',
		inputSchema: z.object({}),
		execute: async () => {
			try {
				const result = await motorClient.helloWorld()
				return {
					success: true,
					message: result.Text || 'Hello World',
					note: 'MOTOR DaaS API connection successful',
				}
			} catch (error) {
				console.error('[helloWorld] Error:', error)
				return `Failed to connect to MOTOR DaaS API: ${error instanceof Error ? error.message : 'Unknown error'}`
			}
		},
	}),
})

