/**
 * Utility functions for MOTOR DaaS tools
 * 
 * Simplified following Supabase patterns:
 * - No global state
 * - Simple error formatting
 * - Reusable helpers for data extraction
 */

import type { ServiceProcedureApplication, ServiceProcedureDocument } from '@/lib/integrations/motor-daas/client'
import { SERVICE_PROCEDURE_SILOS } from '@/lib/integrations/motor-daas/constants/constants'

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Format tool error response (Supabase-style: simple string for minor errors)
 * For major errors, returns structured object with details
 */
export function formatToolError(error: unknown, toolName: string): string | {
	success: false
	error: string
	message: string
	retryAfter?: number
} {
	console.error(`[${toolName}] Error:`, error)

	if (error instanceof Error && 'statusCode' in error) {
		const statusCode = (error as any).statusCode

		if (statusCode === 429) {
			return {
				success: false,
				error: 'Rate limit exceeded',
				message: 'The MOTOR API allows 1500 requests per 15 minutes. Please wait a moment and try again.',
				retryAfter: 900,
			}
		}
		if (statusCode === 401) return `Authentication failed. Please check MOTOR DaaS credentials.`
		if (statusCode === 403) return `Request forbidden. This may be due to a timestamp mismatch. Please try again.`
		if (statusCode === 404) return `Data not found for this vehicle configuration.`
		return `MOTOR API error (HTTP ${statusCode}): ${error.message || 'Unknown error'}`
	}

	if (error instanceof TypeError && error.message.includes('fetch')) {
		return `Network error. Unable to connect to MOTOR API. Please check your internet connection.`
	}

	return `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`
}

// ============================================================================
// SERVICE PROCEDURES
// ============================================================================

/**
 * Get service procedure category by name (case-insensitive)
 * Returns the silo ID and name if found
 */
export function getServiceProcedureCategory(categoryName: string): { id: number; name: string } | null {
	const normalized = categoryName.toLowerCase().trim()
	
	for (const silo of Object.values(SERVICE_PROCEDURE_SILOS)) {
		if (silo.name.toLowerCase().includes(normalized) || normalized.includes(silo.name.toLowerCase())) {
			return silo
		}
		// Also check key words
		const siloWords = silo.name.toLowerCase().split(/[\s&\/]+/)
		for (const word of siloWords) {
			if (word.length > 3 && normalized.includes(word)) {
				return silo
			}
		}
	}
	
	return null
}

/**
 * Get list of available service procedure categories for AI prompts
 */
export function getServiceProcedureCategoryList(): string {
	return Object.values(SERVICE_PROCEDURE_SILOS)
		.map(s => s.name)
		.join(', ')
}

/**
 * Format service procedures for display
 */
export function formatServiceProcedures(applications: ServiceProcedureApplication[]): Array<{
	id: number
	name: string
	category: string
	position?: string
}> {
	return applications.map(app => ({
		id: app.ApplicationID,
		name: app.DisplayName || app.Category?.Article || `Procedure ${app.ApplicationID}`,
		category: app.Category?.Article || 'Service Procedure',
		position: app.Position?.Name,
	}))
}

/**
 * Deduplicate procedures by display name
 */
export function deduplicateProcedures<T extends { name: string }>(procedures: T[]): T[] {
	const seen = new Set<string>()
	return procedures.filter(p => {
		if (seen.has(p.name)) return false
		seen.add(p.name)
		return true
	})
}

/**
 * Procedure step with optional image
 */
export interface ProcedureStep {
	sequence: number
	text: string
	image?: {
		id: number
		name: string
		caption?: string
		format: string
	}
}

/**
 * Clean step text - convert XML/HTML to readable text
 */
function cleanStepText(text: string): string {
	return text
		// Handle emphasis/bold
		.replace(/<emph[^>]*type="bold"[^>]*>([\s\S]*?)<\/emph>/gi, '**$1**')
		.replace(/<emph[^>]*>([\s\S]*?)<\/emph>/gi, '*$1*')
		// Replace xref with "See Figure" text
		.replace(/<xref[^>]*idref="([^"]*)"[^>]*\/>/gi, '(See Figure)')
		// Handle nested step groups
		.replace(/<stepgrp2>/gi, '\n')
		.replace(/<\/stepgrp2>/gi, '')
		.replace(/<stepgrp>/gi, '')
		.replace(/<\/stepgrp>/gi, '')
		// Remove other tags
		.replace(/<\/?MOTOR_Procedure>/gi, '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n')
		.replace(/<p>/gi, '')
		// Clean remaining tags
		.replace(/<\/?[^>]+(>|$)/g, '')
		// HTML entities
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		// Clean whitespace
		.replace(/\n{3,}/g, '\n\n')
		.trim()
}

/**
 * Extract procedure content as interleaved steps with images
 * Parses MOTOR XML format: <MOTOR_Procedure><stepgrp><step>...</step></stepgrp></MOTOR_Procedure>
 * Matches xref references to corresponding images
 * 
 * Format: [Step 1 text] [Image 1] [Step 2 text] [Image 2] ...
 */
export function extractProcedureSteps(items: Array<{
	Data?: string
	Sequence?: number
	ReferenceSet?: { Documents?: ServiceProcedureDocument[] }
}>): ProcedureStep[] {
	const steps: ProcedureStep[] = []
	
	// Sort items by sequence
	const sortedItems = [...items].sort((a, b) => (a.Sequence || 0) - (b.Sequence || 0))
	
	for (const item of sortedItems) {
		if (!item.Data) continue
		
		// Build image lookup map by name (e.g., "TBM1200000000560" -> document)
		const imageMap = new Map<string, ServiceProcedureDocument>()
		if (item.ReferenceSet?.Documents) {
			for (const doc of item.ReferenceSet.Documents) {
				if (doc.IsActive !== false && doc.DocumentID && doc.Name) {
					// Store by lowercase name for case-insensitive matching
					imageMap.set(doc.Name.toLowerCase(), doc)
				}
			}
		}
		
		// Extract individual <step> elements from XML
		// Matches both <step>content</step> and nested structures
		const stepRegex = /<step>([\s\S]*?)<\/step>/gi
		let match
		
		while ((match = stepRegex.exec(item.Data)) !== null) {
			const rawStepContent = match[1]
			
			// Check for xref (figure reference) in this step
			// Format: <xref idref="tbm1200000000560" />
			const xrefMatch = rawStepContent.match(/<xref[^>]*idref="([^"]+)"[^>]*\/?>/i)
			let referencedImage: ServiceProcedureDocument | undefined
			
			if (xrefMatch) {
				const xrefId = xrefMatch[1].toLowerCase()
				referencedImage = imageMap.get(xrefId)
			}
			
			// Clean up the step text
			const cleanedText = cleanStepText(rawStepContent)
			
			if (!cleanedText) continue
			
			steps.push({
				sequence: steps.length + 1,
				text: cleanedText,
				image: referencedImage ? {
					id: referencedImage.DocumentID,
					name: referencedImage.Name || `Image ${referencedImage.DocumentID}`,
					caption: referencedImage.Caption,
					format: referencedImage.Format || 'unknown',
				} : undefined,
			})
		}
		
		// Fallback: if no <step> tags found, treat entire content as one step
		if (steps.length === 0 && item.Data) {
			const cleanedText = cleanStepText(item.Data)
			if (cleanedText) {
				const firstImage = item.ReferenceSet?.Documents?.find(d => d.IsActive !== false && d.DocumentID)
				steps.push({
					sequence: 1,
					text: cleanedText,
					image: firstImage ? {
						id: firstImage.DocumentID,
						name: firstImage.Name || `Image ${firstImage.DocumentID}`,
						caption: firstImage.Caption,
						format: firstImage.Format || 'unknown',
					} : undefined,
				})
			}
		}
	}
	
	return steps
}

/**
 * Extract all images from procedure items (for separate image gallery)
 */
export function extractProcedureImages(items: Array<{ ReferenceSet?: { Documents?: ServiceProcedureDocument[] } }>): Array<{
	id: number
	name: string
	caption?: string
	format: string
	sequence: number
}> {
	const images: Array<{
		id: number
		name: string
		caption?: string
		format: string
		sequence: number
	}> = []
	
	for (const item of items) {
		if (item.ReferenceSet?.Documents) {
			for (const doc of item.ReferenceSet.Documents) {
				if (doc.IsActive !== false && doc.DocumentID) {
					images.push({
						id: doc.DocumentID,
						name: doc.Name || `Image ${doc.DocumentID}`,
						caption: doc.Caption,
						format: doc.Format || 'unknown',
						sequence: doc.Sequence || 0,
					})
				}
			}
		}
	}
	
	// Deduplicate by ID
	const seen = new Set<number>()
	return images
		.sort((a, b) => a.sequence - b.sequence)
		.filter(img => {
			if (seen.has(img.id)) return false
			seen.add(img.id)
			return true
		})
}

// ============================================================================
// WIRING DIAGRAMS
// ============================================================================

/**
 * Known subject categories for wiring diagrams
 */
export const WIRING_DIAGRAM_SUBJECTS = [
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
export function detectWiringDiagramMode(query: string): 'browse' | 'search' {
	const normalized = query.toLowerCase().trim()
	const matchingSubject = WIRING_DIAGRAM_SUBJECTS.find(subject => 
		normalized.includes(subject) || subject.includes(normalized)
	)
	return matchingSubject ? 'browse' : 'search'
}

/**
 * Find matching subject in taxonomy response
 */
export function findMatchingSubject(
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
 * Extract document ID from wiring diagram details response
 */
export function extractDocumentId(details: any): number | null {
	if (details.WiringDiagrams?.[0]?.DiagramSet?.Documents?.length > 0) {
		const docs = details.WiringDiagrams[0].DiagramSet.Documents
		const activeDoc = docs.find((doc: any) => doc.IsActive !== false) || docs[0]
		return activeDoc.DocumentID
	}
	if (details.Documents?.length > 0) {
		return details.Documents[0].DocumentID
	}
	if (details.Applications?.[0]?.Documents?.length > 0) {
		return details.Applications[0].Documents[0].DocumentID
	}
	return null
}

/**
 * Get document list from wiring diagram details response
 */
export function extractDocumentList(details: any): Array<{ id: number; name: string; format: string; sequence: number }> {
	let documents: Array<any> = []
	
	if (details.WiringDiagrams?.[0]?.DiagramSet?.Documents) {
		documents = details.WiringDiagrams[0].DiagramSet.Documents
	} else if (details.Documents) {
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
