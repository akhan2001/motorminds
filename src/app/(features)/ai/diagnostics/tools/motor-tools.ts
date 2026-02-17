/**
 * Motor DaaS Tools
 * 
 * Stateless tools following Supabase patterns:
 * - No caching in tools (stateless)
 * - Simple try/catch error handling
 * - Context passed via closure (dependency injection)
 * - Clear tool descriptions for AI guidance
 */

import { tool } from 'ai'
import { z } from 'zod'
import type { MotorDaasClient } from '@/lib/integrations/motor-daas/client'
import { extractDiagramName } from '@/lib/integrations/motor-daas/wiring-diagrams.utils'
import {
	formatToolError,
	getServiceProcedureCategory,
	getServiceProcedureCategoryList,
	formatServiceProcedures,
	deduplicateProcedures,
	extractProcedureSteps,
	extractProcedureImages,
	detectWiringDiagramMode,
	findMatchingSubject,
	extractDocumentId,
	extractDocumentList,
	validateSearchResults,
	isCategoryRelevant,
} from './motor-daas-utils'
import { inferDiagnosticComponent } from '@/lib/services/diagnostics-3d-locator-service'

// ============================================================================
// TYPES
// ============================================================================

export type MotorToolsContext = {
	baseVehicleId: number
	engineId?: number
	vehicleMake?: string
	motorClient: MotorDaasClient
}

// ============================================================================
// WIRING DIAGRAM HELPERS
// ============================================================================

function formatDiagramResponse(
	applications: Array<any>,
	metadata: { mode: 'browse' | 'search'; subject?: string; subjectId?: number; searchTerm?: string; vehicleMake?: string; baseVehicleId?: number; engineId?: number }
) {
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

	// Deduplicate by name
	const seenNames = new Set<string>()
	const diagrams = allDiagrams.filter(d => {
		if (seenNames.has(d.name)) return false
		seenNames.add(d.name)
		return true
	})

	return { success: true, ...metadata, diagrams, totalCount: diagrams.length }
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const getMotorTools = ({
	baseVehicleId,
	engineId,
	vehicleMake,
	motorClient,
}: MotorToolsContext) => ({

	// ==========================================================================
	// WIRING DIAGRAMS
	// ==========================================================================

	getWiringDiagrams: tool({
		description: `PRIMARY TOOL for finding wiring diagrams. Use this FIRST when user asks for wiring diagrams.

Use when user asks for:
- "wiring diagram", "electrical schematic", "circuit diagram"
- "show wiring for [component/subject]"
- "wiring diagram for [component]" (e.g., "wiring diagram for lights", "wiring diagram for headlight")

Auto-detects browse vs search mode:
- Subject category ("engine", "brakes", "electrical", "lighting") → Browse mode
- Component name ("O2 sensor", "fuel pump", "headlight") → Search mode

IMPORTANT:
- ALWAYS call this tool first for ANY wiring diagram request
- NEVER use this for physical component location requests (e.g., "where is the starter"). Use showComponentLocation for those.
- NEVER call getDiagramDetails directly - it's only for viewing details after diagrams are found
- Pass the user's query directly (e.g., "lights", "headlight", "interior illumination system")
- The tool handles categorization automatically

Returns list of diagrams. Frontend renders them automatically.`,

		inputSchema: z.object({
			query: z.string().describe('Subject category (e.g., "Engine") or component name (e.g., "O2 sensor")'),
			mode: z.enum(['auto', 'browse', 'search']).optional().default('auto'),
		}),

		execute: async ({ query, mode = 'auto' }: { query: string; mode?: 'auto' | 'browse' | 'search' }) => {
			try {
				const executionMode = mode === 'auto' ? await detectWiringDiagramMode(query) : mode

				if (executionMode === 'browse') {
					try {
						const taxonomy = await motorClient.getWiringDiagramsTaxonomy(baseVehicleId, {
							engineId,
							resultType: 'DrillDown',
						})

						if (taxonomy?.Subjects?.length > 0) {
							const subject = await findMatchingSubject(taxonomy.Subjects, query)

							if (subject) {
								const summary = await motorClient.getWiringDiagramsSummary(baseVehicleId, {
									subjectId: subject.ID,
									engineId,
									pageIndex: 0,
									itemsPerPage: 30,
								})

								return formatDiagramResponse(summary.Applications, {
									mode: 'browse',
									subject: subject.Name,
									subjectId: subject.ID,
									vehicleMake,
									baseVehicleId,
									engineId,
								})
							}

							return {
								success: false,
								error: `Subject "${query}" not found. Available: ${taxonomy.Subjects.map(s => s.Name).join(', ')}`,
								mode: 'browse',
							}
						}
					} catch {
						// Fall through to search mode
					}
				}

				// Search mode
				const summary = await motorClient.getWiringDiagramsSummary(baseVehicleId, {
					searchTerm: query,
					engineId,
					pageIndex: 0,
					itemsPerPage: 30,
				})

				return formatDiagramResponse(summary.Applications, {
					mode: 'search',
					searchTerm: query,
					vehicleMake,
					baseVehicleId,
					engineId,
				})
			} catch (error) {
				return formatToolError(error, 'getWiringDiagrams')
			}
		},
	}),

	getDiagramDetails: tool({
		description: `INTERNAL HELPER TOOL - DO NOT CALL DIRECTLY.

This tool is ONLY used internally by the frontend when viewing diagram details.
NEVER call this tool when user asks for wiring diagrams - use getWiringDiagrams instead.

Only use if:
- User explicitly clicks on a specific diagram that was already returned by getWiringDiagrams
- You have an applicationId from a previous getWiringDiagrams call

For all wiring diagram searches, use getWiringDiagrams.`,

		inputSchema: z.object({
			applicationId: z.number().describe('Application ID from wiring diagram'),
		}),

		execute: async ({ applicationId }: { applicationId: number }) => {
			try {
				const details = await motorClient.getWiringDiagramDetails(baseVehicleId, applicationId, engineId)
				const documents = extractDocumentList(details)

				return { success: true, applicationId, documents, totalDocuments: documents.length }
			} catch (error) {
				return formatToolError(error, 'getDiagramDetails')
			}
		},
	}),

	getDiagramComponents: tool({
		description: `INTERNAL HELPER TOOL - DO NOT CALL DIRECTLY.

This tool is ONLY used internally by the frontend when viewing components from a specific wiring diagram document.
NEVER call this tool directly - use getWiringDiagrams to find diagrams first.

For all wiring diagram searches, use getWiringDiagrams.
For parts lookup, use perplexityResearchTool.`,

		inputSchema: z.object({
			applicationId: z.number().describe('Application ID from wiring diagram'),
			documentId: z.number().optional().describe('Document ID (uses first if not provided)'),
		}),

		execute: async ({ applicationId, documentId }: { applicationId: number; documentId?: number }) => {
			try {
				let finalDocumentId = documentId

				if (!finalDocumentId) {
					const details = await motorClient.getWiringDiagramDetails(baseVehicleId, applicationId, engineId)
					const extractedId = extractDocumentId(details)

					if (!extractedId) {
						return { success: false, error: 'No documents found for this wiring diagram' }
					}
					
					finalDocumentId = extractedId
				}

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
					location: comp.Location,
					connectorId: comp.ConnectorID,
					pinNumber: comp.PinNumber,
					wireColor: comp.WireColor,
					wireGauge: comp.WireGauge,
				}))

				return { success: true, applicationId, documentId: finalDocumentId, components, totalCount: components.length }
			} catch (error) {
				return formatToolError(error, 'getDiagramComponents')
			}
		},
	}),

	getRelatedWiringDiagrams: tool({
		description: `INTERNAL HELPER TOOL - DO NOT CALL DIRECTLY.

This tool is ONLY used internally by the frontend to find related diagrams.
NEVER call this tool directly - use getWiringDiagrams to find diagrams.

For all wiring diagram searches, use getWiringDiagrams.`,

		inputSchema: z.object({
			contentType: z.string().describe('Content type (e.g., "OEMComponents", "ServiceProcedures")'),
			applicationId: z.number().describe('Application ID of the related content'),
		}),

		execute: async ({ contentType, applicationId }: { contentType: string; applicationId: number }) => {
			try {
				const summary = await motorClient.getWiringDiagramsSummaryWithRelation(
					baseVehicleId,
					contentType,
					applicationId,
					{ engineId, pageIndex: 0, itemsPerPage: 30 }
				)

				const diagrams = summary.Applications.map(app => ({
					id: app.ApplicationID,
					name: extractDiagramName(app),
					href: app.Links?.find((l: any) => l.Rel === 'Self')?.Href,
				}))

				return { success: true, contentType, relatedToApplicationId: applicationId, vehicleMake, baseVehicleId, engineId, diagrams, totalCount: diagrams.length }
			} catch (error) {
				return formatToolError(error, 'getRelatedWiringDiagrams')
			}
		},
	}),

	// ==========================================================================
	// OEM COMPONENTS
	// ==========================================================================

	getOEMComponents: tool({
		description: `INTERNAL HELPER TOOL - DO NOT CALL DIRECTLY.

This tool is ONLY used internally by the frontend for wiring diagram component lookups.
NEVER call this tool directly.

For ALL parts queries (including parts from wiring diagrams), use perplexityResearchTool instead.
For wiring diagrams, use getWiringDiagrams.`,

		inputSchema: z.object({
			searchTerm: z.string().optional().describe('Component name or part number'),
			pageIndex: z.number().optional().default(0),
			itemsPerPage: z.number().optional().default(30),
		}),

		execute: async ({ searchTerm, pageIndex = 0, itemsPerPage = 30 }: { searchTerm?: string; pageIndex?: number; itemsPerPage?: number }) => {
			try {
				const summary = await motorClient.getOEMComponentsSummary(baseVehicleId, {
					engineId,
					searchTerm,
					pageIndex,
					itemsPerPage,
				})

				const components = summary.Applications.map(app => ({
					id: app.ApplicationID,
					name: app.DisplayName || `Component ${app.ApplicationID}`,
					description: app.Description,
					partNumber: app.PartNumber,
				}))

				return { success: true, components, totalCount: components.length, searchTerm }
			} catch (error) {
				return formatToolError(error, 'getOEMComponents')
			}
		},
	}),

	getRelatedOEMComponents: tool({
		description: `INTERNAL HELPER TOOL - DO NOT CALL DIRECTLY.

This tool is ONLY used internally by the frontend to find related OEM components.
NEVER call this tool directly.

For ALL parts queries, use perplexityResearchTool instead.
For wiring diagrams, use getWiringDiagrams.`,

		inputSchema: z.object({
			contentType: z.string().describe('Content type (e.g., "WiringDiagrams")'),
			applicationId: z.number().describe('Application ID of the content'),
		}),

		execute: async ({ contentType, applicationId }: { contentType: string; applicationId: number }) => {
			try {
				const summary = await motorClient.getOEMComponentsSummaryWithRelation(
					baseVehicleId,
					contentType,
					applicationId,
					{ engineId, pageIndex: 0, itemsPerPage: 30 }
				)

				const components = summary.Applications.map(app => ({
					id: app.ApplicationID,
					name: app.DisplayName || `Component ${app.ApplicationID}`,
					description: app.Description,
					partNumber: app.PartNumber,
				}))

				return { success: true, contentType, relatedToApplicationId: applicationId, vehicleMake, components, totalCount: components.length }
			} catch (error) {
				return formatToolError(error, 'getRelatedOEMComponents')
			}
		},
	}),

	// ==========================================================================
	// SERVICE PROCEDURES
	// ==========================================================================

	getServiceProcedures: tool({
		description: `Get OEM service procedures for a vehicle.

IMPORTANT: Pass ONLY the component name, NOT the vehicle info (vehicle is already in context).
Do NOT use this tool when the user asks physical location questions like "where is the starter?".
For physical location requests, use showComponentLocation.

Examples of correct usage:
- User: "How to replace the timing chain?" → query: "timing chain", category: "timing chain"
- User: "Battery replacement procedure" → query: "battery", category: "battery"
- User: "How to change brake pads?" → query: "brake", category: "brake"
- User: "Transmission repair steps" → query: "transmission", category: "transmission"

Available categories: ${getServiceProcedureCategoryList()}

Use category for best results. Falls back to search if no category match.`,

		inputSchema: z.object({
			query: z.string().describe('Component name ONLY (e.g., "timing chain", "battery", "brake pads"). Do NOT include vehicle info.'),
			category: z.string().optional().describe('Category name from the list above (e.g., "timing chain", "battery", "transmission")'),
		}),

		execute: async ({ query, category }: { query: string; category?: string }) => {
			try {
				const combined = `${query || ''} ${category || ''}`.toLowerCase().trim()
				const hasProcedureIntent =
					/\b(replace|replacement|remove|removal|install|installation|repair|procedure|steps|how to|r&r|service)\b/i.test(
						combined
					)
				const isLocationComponent = /\b(starter|battery|alternator|fuse box|fuse_box|fuse)\b/i.test(combined)

				// If the model called procedures for a likely location question, hand off to location renderer.
				if (isLocationComponent && !hasProcedureIntent) {
					const inferred = inferDiagnosticComponent(query)
					return {
						success: false,
						switchToComponentLocation: true,
						component: inferred.component,
						confidence: inferred.confidence,
						possibleIssue: inferred.possibleIssue,
						explanation: inferred.explanation,
						userPrompt: query,
						message:
							'This query appears to be a component location request. Rendering 3D component location instead of procedure list.',
					}
				}

				// Phase 1: Try category match with confidence-based validation
				// Following Supabase pattern: explicit mappings with validation
				const categoryMatch = category
					? getServiceProcedureCategory(category)
					: getServiceProcedureCategory(query)

				let summary
				let source: 'category' | 'search' = 'search'
				let matchedCategoryName: string | undefined
				let warning: string | undefined

				// Only use category if high or medium confidence
				if (categoryMatch && (categoryMatch.confidence === 'high' || categoryMatch.confidence === 'medium')) {
					summary = await motorClient.getServiceProceduresSummary(baseVehicleId, {
						contentSilos: [categoryMatch.id],
						engineId,
						pageIndex: 0,
						itemsPerPage: 30,
					})

					// Validate category results are relevant
					if (summary?.Applications?.length) {
						const formattedProcedures = formatServiceProcedures(summary.Applications)
						
						if (isCategoryRelevant(formattedProcedures, query)) {
							// Category results are relevant - use them
							source = 'category'
							matchedCategoryName = categoryMatch.name
							
							// Validate and filter results
							const validated = validateSearchResults(formattedProcedures, query)
							const procedures = deduplicateProcedures(validated)
							
							if (validated.length < formattedProcedures.length) {
								warning = 'Some results filtered as potentially irrelevant'
							}

							return {
								success: true,
								query,
								source,
								matchedCategory: matchedCategoryName,
								procedures,
								totalCount: procedures.length,
								baseVehicleId,
								engineId,
								vehicleMake,
								warning,
							}
						}
						// Category results not relevant - fall through to search
					}
				}

				// Phase 2: Fallback to search
				summary = await motorClient.getServiceProceduresSummary(baseVehicleId, {
					searchTerm: query,
					engineId,
					pageIndex: 0,
					itemsPerPage: 30,
				})

				if (!summary?.Applications?.length) {
					return {
						success: false,
						message: `No service procedures found for "${query}". This procedure may not be available for this vehicle.`,
						availableCategories: getServiceProcedureCategoryList(),
					}
				}

				// Validate search results
				const formattedProcedures = formatServiceProcedures(summary.Applications)
				const validated = validateSearchResults(formattedProcedures, query)
				const procedures = deduplicateProcedures(validated)

				if (validated.length < formattedProcedures.length) {
					warning = 'Some results filtered as potentially irrelevant'
				}

				return {
					success: true,
					query,
					source,
					matchedCategory: matchedCategoryName,
					procedures,
					totalCount: procedures.length,
					baseVehicleId,
					engineId,
					vehicleMake,
					warning,
				}
			} catch (error) {
				return formatToolError(error, 'getServiceProcedures')
			}
		},
	}),

	getServiceProcedureDetails: tool({
		description: `Get full procedure content with steps and images. Use AFTER user selects from procedure list.

Returns interleaved steps with images for proper display:
[Step 1 text] [Image 1] [Step 2 text] [Image 2] ...`,

		inputSchema: z.object({
			applicationId: z.number().describe('ApplicationID from the procedure list'),
			procedureName: z.string().optional().describe('Procedure name for display'),
		}),

		execute: async ({ applicationId, procedureName }: { applicationId: number; procedureName?: string }) => {
			try {
				const details = await motorClient.getServiceProcedureDetails(baseVehicleId, applicationId, engineId)

				if (!details.ServiceProcedures?.length) {
					return { success: false, error: 'No procedure details found.' }
				}

				const procedure = details.ServiceProcedures[0]

				// Get interleaved steps with images
				const steps = extractProcedureSteps(procedure.Items || [])
				// Also get all images separately for gallery view
				const allImages = extractProcedureImages(procedure.Items || [])

				return {
					success: true,
					applicationId,
					procedureName: procedureName || procedure.Category?.Article || 'Service Procedure',
					category: procedure.Category,
					position: procedure.Position?.Name,
					steps, // Interleaved: each step may have an image
					images: allImages, // All images for gallery
					imageCount: allImages.length,
					baseVehicleId,
					engineId,
					vehicleMake,
				}
			} catch (error) {
				return formatToolError(error, 'getServiceProcedureDetails')
			}
		},
	}),

	// ==========================================================================
	// UTILITY
	// ==========================================================================

	helloWorld: tool({
		description: 'Test MOTOR DaaS API connection.',
		inputSchema: z.object({}),
		execute: async () => {
			try {
				const result = await motorClient.helloWorld()
				return { success: true, message: result.Text || 'Hello World', note: 'MOTOR DaaS API connection successful' }
			} catch (error) {
				return formatToolError(error, 'helloWorld')
			}
		},
	}),
})
