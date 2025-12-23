// src/app/(features)/ai/diagnostics/tools/motor-daas-tools.ts

import { tool } from 'ai'
import { z } from 'zod'

import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'
import { extractDiagramName } from '@/lib/integrations/motor-daas/wiring-diagrams.utils'
import { getDefaultVehicleId, getDefaultEngineId, formatToolError } from './motor-daas-utils'
import { WIRING_DIAGRAM_SUBJECTS } from '../types/MotorDaaS'

// Lazy client creation to avoid errors if env vars aren't set
function getMotorClient(): MotorDaasClient {
	const publicKey = process.env.MOTOR_DAAS_PUBLIC_KEY
	const privateKey = process.env.MOTOR_DAAS_PRIVATE_KEY

	if (!publicKey || !privateKey) {
		throw new Error(
			'MOTOR DaaS credentials not configured. ' +
			'Set MOTOR_DAAS_PUBLIC_KEY and MOTOR_DAAS_PRIVATE_KEY environment variables.'
		)
	}

	return new MotorDaasClient({
		publicKey,
		privateKey,
		baseUrl: 'https://api.motor.com/v1'
	})
}

export const helloWorldTool = tool({
	description: 'Test connection to MOTOR DaaS API. Returns a simple "Hello World" message to verify the API is working.',
	inputSchema: z.object({}),
	execute: async () => {
		try {
			const motorClient = getMotorClient()
			const result = await motorClient.helloWorld()
			console.log('[helloWorldTool] Success:', result)
			return {
				success: true,
				message: result.Text || 'Hello World',
				note: 'MOTOR DaaS API connection successful',
			}
		} catch (error) {
			return formatToolError(error, 'helloWorld')
		}
	}
})


export const getWiringDiagramsTool = tool({
	description: 'Search and retrieve wiring diagrams for the vehicle. Can browse by subject category (e.g., "Engine", "Brakes", "Electrical") or search by component name (e.g., "O2 sensor", "brake light circuit"). Returns a list of available diagrams with their IDs and names.',
	inputSchema: z.object({
		query: z.string().describe('Subject category name (e.g., "Engine", "Brakes", "Electrical") or component name to search for (e.g., "O2 sensor wiring", "brake light")'),
		baseVehicleId: z.number().optional().describe('Base Vehicle ID (will use context if not provided)'),
		engineId: z.number().optional().describe('Engine ID for filtering (recommended for Honda)'),
	}),
	execute: async ({ query, baseVehicleId, engineId }: { query: string; baseVehicleId?: number; engineId?: number }) => {
		try {
			const motorClient = getMotorClient()

			// Get vehicle and engine IDs with defaults
			const vehicleId = getDefaultVehicleId(baseVehicleId)
			const engId = getDefaultEngineId(engineId)

			// Normalize query for comparison
			const normalizedQuery = query.toLowerCase().trim()

			// Check if query matches a subject name
			const matchingSubject = WIRING_DIAGRAM_SUBJECTS.find(subject => 
				normalizedQuery.includes(subject) || subject.includes(normalizedQuery)
			)

			if (matchingSubject) {
				// Browse mode: Get taxonomy first, then summary for matching subject
				const taxonomy = await motorClient.getWiringDiagramsTaxonomy(vehicleId, {
					engineId: engId,
					resultType: 'DrillDown'
				})

				// Find subject that matches the query
				const subject = taxonomy.Subjects.find(s => 
					s.Name.toLowerCase().includes(normalizedQuery) ||
					normalizedQuery.includes(s.Name.toLowerCase())
				)

				if (!subject) {
					return {
						success: false,
						error: `Subject "${query}" not found. Available subjects: ${taxonomy.Subjects.map(s => s.Name).join(', ')}`,
						mode: 'browse'
					}
				}

				// Get summary for that subject
				const summary = await motorClient.getWiringDiagramsSummary(vehicleId, {
					subjectId: subject.ID,
					engineId: engId,
					pageIndex: 0,
					itemsPerPage: 30
				})

				// Debug: Log first application to see structure
				if (summary.Applications.length > 0 && process.env.NODE_ENV === 'development') {
					console.log('[getWiringDiagramsTool] Sample application:', summary.Applications[0])
					console.log('[getWiringDiagramsTool] SAESubjects:', summary.Applications[0].SAESubjects)
				}

				// Map applications to diagram objects using shared utility
				const diagrams = summary.Applications.map(app => ({
					id: app.ApplicationID,
					name: extractDiagramName(app),
					href: app.Links?.find(l => l.Rel === 'Self')?.Href,
				}))

				return {
					success: true,
					mode: 'browse',
					subject: subject.Name,
					subjectId: subject.ID,
					diagrams,
					totalCount: diagrams.length,
				}
			} else {
				// Search mode: Search summaries directly by component name
				const summary = await motorClient.getWiringDiagramsSummary(vehicleId, {
					searchTerm: query,
					engineId: engId,
					pageIndex: 0,
					itemsPerPage: 30,
				})

				// Map applications to diagram objects using shared utility
				const diagrams = summary.Applications.map(app => ({
					id: app.ApplicationID,
					name: extractDiagramName(app),
					href: app.Links?.find(l => l.Rel === 'Self')?.Href,
				}))

				return {
					success: true,
					mode: 'search',
					searchTerm: query,
					diagrams,
					totalCount: diagrams.length
				}
			}
		} catch (error) {
			return formatToolError(error, 'getWiringDiagrams')
		}
	}
})

export const getOEMComponentsTool = tool({
	description: 'Search and retrieve OEM components for the vehicle. Returns a list of available components with their IDs, names, and part numbers.',
	inputSchema: z.object({
		baseVehicleId: z.number().optional().describe('Base Vehicle ID (will use context if not provided)'),
		engineId: z.number().optional().describe('Engine ID for filtering'),
		searchTerm: z.string().optional().describe('Search term to filter components by name or part number'),
		pageIndex: z.number().optional().describe('Page index for pagination (default: 0)'),
		itemsPerPage: z.number().optional().describe('Number of items per page (default: 30)'),
	}),
	execute: async ({ baseVehicleId, engineId, searchTerm, pageIndex, itemsPerPage }: { 
		baseVehicleId?: number; 
		engineId?: number; 
		searchTerm?: string; 
		pageIndex?: number; 
		itemsPerPage?: number;
	}) => {
		try {
			const motorClient = getMotorClient()

			const vehicleId = getDefaultVehicleId(baseVehicleId)
			const engId = getDefaultEngineId(engineId)

			const summary = await motorClient.getOEMComponentsSummary(vehicleId, {
				engineId: engId,
				searchTerm,
				pageIndex: pageIndex || 0,
				itemsPerPage: itemsPerPage || 30
			})

			const components = summary.Applications.map(app => ({
				id: app.ApplicationID,
				name: app.DisplayName || `Component ${app.ApplicationID}`,
				description: app.Description,
				partNumber: app.PartNumber,
				partNumbers: app.PartNumbers,
				href: app.Links?.find(l => l.Rel === 'Self')?.Href
			}))

			return {
				success: true,
				components,
				totalCount: components.length,
				searchTerm: searchTerm || undefined
			}
		} catch (error) {
			return formatToolError(error, 'getOEMComponents')
		}
	}
})

export const getRelatedWiringDiagramsTool = tool({
	description: 'Find wiring diagrams related to a specific content (e.g., service procedure, component). Returns a list of related wiring diagrams.',
	inputSchema: z.object({
		baseVehicleId: z.number().describe('Base Vehicle ID'),
		contentType: z.string().describe('Content type (e.g., "ServiceProcedures", "OEMComponents")'),
		applicationId: z.number().describe('Application ID of the related content'),
		engineId: z.number().optional().describe('Engine ID for filtering'),
		pageIndex: z.number().optional().describe('Page index for pagination'),
		itemsPerPage: z.number().optional().describe('Number of items per page'),
	}),
	execute: async ({ baseVehicleId, contentType, applicationId, engineId, pageIndex, itemsPerPage }: {
		baseVehicleId: number;
		contentType: string;
		applicationId: number;
		engineId?: number;
		pageIndex?: number;
		itemsPerPage?: number;
	}) => {
		try {
			const motorClient = getMotorClient()

			const summary = await motorClient.getWiringDiagramsSummaryWithRelation(baseVehicleId, contentType, applicationId, {
				engineId,
				pageIndex: pageIndex || 0,
				itemsPerPage: itemsPerPage || 30
			})

			// Map applications to diagram objects using shared utility
			const diagrams = summary.Applications.map(app => ({
				id: app.ApplicationID,
				name: extractDiagramName(app),
				href: app.Links?.find(l => l.Rel === 'Self')?.Href,
			}))

			return {
				success: true,
				contentType,
				relatedToApplicationId: applicationId,
				diagrams,
				totalCount: diagrams.length
			}
		} catch (error) {
			return formatToolError(error, 'getRelatedWiringDiagrams')
		}
	}
})

export const getRelatedOEMComponentsTool = tool({
	description: 'Get OEM components related to a specific wiring diagram or other content. Returns a list of related components.',
	inputSchema: z.object({
		baseVehicleId: z.number().describe('Base Vehicle ID'),
		contentType: z.string().describe('Content type (e.g., "WiringDiagrams")'),
		applicationId: z.number().describe('Application ID of the content'),
		engineId: z.number().optional().describe('Engine ID for filtering'),
		pageIndex: z.number().optional().describe('Page index for pagination'),
		itemsPerPage: z.number().optional().describe('Number of items per page'),
	}),
	execute: async ({ baseVehicleId, contentType, applicationId, engineId, pageIndex, itemsPerPage }: {
		baseVehicleId: number;
		contentType: string;
		applicationId: number;
		engineId?: number;
		pageIndex?: number;
		itemsPerPage?: number;
	}) => {
		try {
			const motorClient = getMotorClient()

			const summary = await motorClient.getOEMComponentsSummaryWithRelation(baseVehicleId, contentType, applicationId, {
				engineId,
				pageIndex: pageIndex || 0,
				itemsPerPage: itemsPerPage || 30
			})

			const components = summary.Applications.map(app => ({
				id: app.ApplicationID,
				name: app.DisplayName || `Component ${app.ApplicationID}`,
				description: app.Description,
				partNumber: app.PartNumber,
				partNumbers: app.PartNumbers,
				href: app.Links?.find(l => l.Rel === 'Self')?.Href
			}))

			return {
				success: true,
				contentType,
				relatedToApplicationId: applicationId,
				components,
				totalCount: components.length
			}
		} catch (error) {
			return formatToolError(error, 'getRelatedOEMComponents')
		}
	}
})

export const getDiagramComponentsTool = tool({
	description: 'Get detailed OEM component list for a specific wiring diagram document. Returns detailed component information including part numbers, locations, and connector details.',
	inputSchema: z.object({
		baseVehicleId: z.number().describe('Base Vehicle ID'),
		contentType: z.string().describe('Content type (typically "WiringDiagrams")'),
		applicationId: z.number().describe('Application ID of the wiring diagram'),
		documentId: z.number().describe('Document ID of the wiring diagram document'),
	}),
	execute: async ({ baseVehicleId, contentType, applicationId, documentId }: {
		baseVehicleId: number;
		contentType: string;
		applicationId: number;
		documentId: number;
	}) => {
		try {
			const motorClient = getMotorClient()

			const details = await motorClient.getOEMComponentsDetailListByApplicationAndDocument(
				baseVehicleId,
				contentType,
				applicationId,
				documentId
			)

			const components = (details.Components || []).map(comp => ({
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
				notes: comp.Notes
			}))

			return {
				success: true,
				contentType,
				applicationId,
				documentId,
				components,
				totalCount: components.length
			}
		} catch (error) {
			return formatToolError(error, 'getDiagramComponents')
		}
	}
})

export const getMotorTools = () => ({
	helloWorld: helloWorldTool,
	getWiringDiagrams: getWiringDiagramsTool,
	getOEMComponents: getOEMComponentsTool,
	getRelatedWiringDiagrams: getRelatedWiringDiagramsTool,
	getRelatedOEMComponents: getRelatedOEMComponentsTool,
	getDiagramComponents: getDiagramComponentsTool,
})