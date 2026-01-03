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
	metadata: { mode: 'browse' | 'search'; subject?: string; subjectId?: number; searchTerm?: string; vehicleMake?: string; baseVehicleId?: number; engineId?: number }
) {
	// #region agent log
	const inputAppIds = applications.map(app => app.ApplicationID);
	const uniqueInputIds = [...new Set(inputAppIds)];
	fetch('http://127.0.0.1:7242/ingest/dc692189-dfb9-43d5-9c3b-bdcc7236349c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'motor-tools.ts:formatDiagramResponse:entry',message:'Formatting diagrams',data:{inputCount:applications.length,uniqueCount:uniqueInputIds.length,hasDuplicates:inputAppIds.length!==uniqueInputIds.length,mode:metadata.mode,subject:metadata.subject||null,searchTerm:metadata.searchTerm||null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
	// #endregion
	
	const allDiagrams = applications.map(app => ({
		id: app.ApplicationID,
		name: extractDiagramName(app),
		documentCount: app.Item?.DocumentCount || 0,
		subjects: app.SAESubjects?.map((s: any) => s.Name) || [],
		systems: app.SAESubjects?.flatMap((s: any) => 
			s.Systems?.filter((sys: any) => sys.IsActive)?.map((sys: any) => sys.Name) || []
		) || [],
		href: app.Links?.find((l: any) => l.Rel === 'Self')?.Href,
	}))
	
	// Deduplicate by name - keep first occurrence of each unique diagram name
	const seenNames = new Set<string>()
	const diagrams = allDiagrams.filter(d => {
		if (seenNames.has(d.name)) {
			return false
		}
		seenNames.add(d.name)
		return true
	})
	
	// #region agent log
	fetch('http://127.0.0.1:7242/ingest/dc692189-dfb9-43d5-9c3b-bdcc7236349c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'motor-tools.ts:formatDiagramResponse:exit',message:'Returning diagrams',data:{beforeDedup:allDiagrams.length,afterDedup:diagrams.length,uniqueNames:diagrams.map(d=>d.name)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
	// #endregion

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
	metadata?: { searchTerm?: string; vehicleMake?: string }
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
	vehicleMake?: string
	motorClient: MotorDaasClient
}

/**
 * Create Motor DaaS tools with context injected via closure
 * Following Supabase's stateless tool pattern
 */
export const getMotorTools = ({
	baseVehicleId,
	engineId,
	vehicleMake,
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
				
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/dc692189-dfb9-43d5-9c3b-bdcc7236349c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'motor-tools.ts:getWiringDiagrams:entry',message:'Tool called',data:{query,mode,baseVehicleId,engineId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B'})}).catch(()=>{});
				// #endregion
				
				// Determine execution mode
				const executionMode = mode === 'auto' 
					? detectWiringDiagramMode(query)
					: mode
				
				console.log('[getWiringDiagrams] Execution mode:', executionMode)
				
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/dc692189-dfb9-43d5-9c3b-bdcc7236349c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'motor-tools.ts:getWiringDiagrams:mode',message:'Execution mode determined',data:{executionMode,queryLower:query.toLowerCase()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});

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
							
							// #region agent log
							fetch('http://127.0.0.1:7242/ingest/dc692189-dfb9-43d5-9c3b-bdcc7236349c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'motor-tools.ts:getWiringDiagrams:taxonomy',message:'Taxonomy subjects found',data:{subjectCount:taxonomy.Subjects.length,subjects:taxonomy.Subjects.map(s=>s.Name),matchedSubject:subject?.Name||null,matchedSubjectId:subject?.ID||null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
							// #endregion
							
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
								
								// #region agent log
								const appIds = summary?.Applications?.map((a: any) => a.ApplicationID) || [];
								const uniqueAppIds = [...new Set(appIds)];
								fetch('http://127.0.0.1:7242/ingest/dc692189-dfb9-43d5-9c3b-bdcc7236349c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'motor-tools.ts:getWiringDiagrams:summary',message:'API summary result',data:{totalApps:appIds.length,uniqueApps:uniqueAppIds.length,hasDuplicates:appIds.length!==uniqueAppIds.length,sampleAppIds:appIds.slice(0,10)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
								// #endregion

								return formatDiagramResponse(summary.Applications, {
									mode: 'browse',
									subject: subject.Name,
									subjectId: subject.ID,
									vehicleMake,
									baseVehicleId,
									engineId,
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
				
				// #region agent log
				fetch('http://127.0.0.1:7242/ingest/dc692189-dfb9-43d5-9c3b-bdcc7236349c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'motor-tools.ts:getWiringDiagrams:searchMode',message:'Using search mode',data:{query,baseVehicleId,engineId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
				// #endregion
				
				const summary = await motorClient.getWiringDiagramsSummary(baseVehicleId, {
					searchTerm: query,
					engineId,
					pageIndex: 0,
					itemsPerPage: 30,
				})
				
				console.log('[getWiringDiagrams] Search result:', {
					applicationCount: summary?.Applications?.length || 0
				})
				
				// #region agent log
				const searchAppIds = summary?.Applications?.map((a: any) => a.ApplicationID) || [];
				const uniqueSearchAppIds = [...new Set(searchAppIds)];
				fetch('http://127.0.0.1:7242/ingest/dc692189-dfb9-43d5-9c3b-bdcc7236349c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'motor-tools.ts:getWiringDiagrams:searchResult',message:'Search API result',data:{totalApps:searchAppIds.length,uniqueApps:uniqueSearchAppIds.length,hasDuplicates:searchAppIds.length!==uniqueSearchAppIds.length,sampleAppIds:searchAppIds.slice(0,10)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
				// #endregion

				return formatDiagramResponse(summary.Applications, {
					mode: 'search',
					searchTerm: query,
					vehicleMake,
					baseVehicleId,
					engineId,
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

				return formatComponentResponse(summary.Applications, { searchTerm, vehicleMake })
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
					vehicleMake,
					baseVehicleId,
					engineId,
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
					vehicleMake,
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

