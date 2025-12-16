// src/app/(features)/ai/diagnostics/tools/motor-daas-tools.ts

import { tool } from 'ai'
import { z } from 'zod'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

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
			const motorClient = getMotorClient() // Initialize client here
			// console.log('[helloWorldTool] Starting MOTOR DaaS HelloWorld call...')
			const result = await motorClient.helloWorld()
			console.log('[helloWorldTool] Success:', result)
			return {
				success: true,
				message: result.Text || 'Hello World',
				note: 'MOTOR DaaS API connection successful'
			}
		} catch (error) {
			console.error('[helloWorldTool] Error:', error)
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			const errorDetails = error instanceof Error && 'statusCode' in error 
				? `Status ${(error as any).statusCode}: ${errorMessage}`
				: errorMessage
			
			return {
				success: false,
				error: errorDetails,
				message: `Failed to connect to MOTOR DaaS API: ${errorDetails}`,
				details: error instanceof Error ? {
					name: error.name,
					message: error.message,
					...(error as any).statusCode && { statusCode: (error as any).statusCode },
					...(error as any).errorCode && { errorCode: (error as any).errorCode }
				} : undefined
			}
		}
	}
})

// Common subject names for wiring diagrams
const WIRING_DIAGRAM_SUBJECTS = [
	'engine',
	'brakes',
	'electrical',
	'body',
	'hvac',
	'lighting',
	'transmission',
	'steering',
	'restraints',
	'warning systems',
	'body & accessories',
	'electrical distribution',
	'interior & driver amenity'
]

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

			// Default to Honda Civic test data if not provided
			const vehicleId = baseVehicleId || 22124 // 2010 Honda Civic
			const engId = engineId || 2913 // 1.8L L4

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
				}

				// Map applications to diagram objects
				const diagrams = summary.Applications.map(app => ({
					id: app.ApplicationID,
					name: app.DisplayName || `Wiring Diagram ${app.ApplicationID}`,
					href: app.Links?.find(l => l.Rel === 'Self')?.Href
				}))

				return {
					success: true,
					mode: 'browse',
					subject: subject.Name,
					subjectId: subject.ID,
					diagrams,
					totalCount: diagrams.length
				}
			} else {
				// Search mode: Search summaries directly by component name
				const summary = await motorClient.getWiringDiagramsSummary(vehicleId, {
					searchTerm: query,
					engineId: engId,
					pageIndex: 0,
					itemsPerPage: 30
				})

				// Map applications to diagram objects
				const diagrams = summary.Applications.map(app => ({
					id: app.ApplicationID,
					name: app.DisplayName || `Wiring Diagram ${app.ApplicationID}`,
					href: app.Links?.find(l => l.Rel === 'Self')?.Href
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
			console.error('[getWiringDiagramsTool] Error:', error)
			const errorMessage = error instanceof Error ? error.message : 'Unknown error'
			const errorDetails = error instanceof Error && 'statusCode' in error 
				? `Status ${(error as any).statusCode}: ${errorMessage}`
				: errorMessage
			
			return {
				success: false,
				error: errorDetails,
				message: `Failed to retrieve wiring diagrams: ${errorDetails}`,
				details: error instanceof Error ? {
					name: error.name,
					message: error.message,
					...(error as any).statusCode && { statusCode: (error as any).statusCode },
					...(error as any).errorCode && { errorCode: (error as any).errorCode }
				} : undefined
			}
		}
	}
})

export const getMotorTools = () => ({
	helloWorld: helloWorldTool,
	getWiringDiagrams: getWiringDiagramsTool
})
