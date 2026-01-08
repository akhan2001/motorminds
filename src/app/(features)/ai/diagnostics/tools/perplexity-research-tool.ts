// src/app/(features)/ai/diagnostics/tools/perplexity-research-tool.ts

import { tool } from 'ai'
import { z } from 'zod'

import { PERPLEXITY_DIAGNOSTIC_PROMPT, PERPLEXITY_PARTS_PROMPT } from './prompts'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

// Detect if query is asking for parts
function isPartsQuery(query: string): boolean {
	const partsKeywords = [
		'part', 'parts', 'part number', 'part numbers',
		'price', 'pricing', 'cost', 'buy', 'purchase',
		'where to buy', 'supplier', 'retailer', 'store',
		'oem part', 'aftermarket', 'replacement part',
		'find part', 'locate part', 'get part'
	]
	const lowerQuery = query.toLowerCase()
	return partsKeywords.some(keyword => lowerQuery.includes(keyword))
}

export const perplexityResearchTool = tool({
		description: `PRIMARY RESEARCH TOOL - Use for diagnostic questions AND parts searches.

	For DIAGNOSTICS (symptoms, DTCs, troubleshooting):
	- Common failures and fixes for specific make/model/year
	- TSB lookups and recall info
	- Forum-proven solutions
	- DTC troubleshooting steps
	
	For PARTS (when user asks about parts, pricing, suppliers):
	- Part numbers and availability
	- Pricing from US/Canadian retailers
	- OEM and aftermarket options

	USE THIS TOOL when user reports:
	- Symptoms: "rough idle", "check engine light", "no start", "stalling"
	- DTC codes: P0xxx, Bxxxx, Cxxxx, Uxxxx
	- Parts: "find part", "part number", "price", "where to buy"
	- "What's the most likely cause of..."

	Format query as: "[symptom] [year] [make] [model] common causes" or "[DTC code] [make] fix" or "[part name] [year] [make] [model]"`,

	inputSchema: z.object({
		query: z.string().describe('Search query - include symptom + year + make + model for best results. Example: "P0420 2010 Camaro fix" or "rough idle Chevrolet V8 common causes"'),
		vehicleContext: z.object({
			make: z.string().optional(),
			model: z.string().optional(),
			year: z.string().optional(),
			engine: z.string().optional(),
		}).optional().describe('Vehicle context to refine search'),
	}),

	execute: async ({ query, vehicleContext }: { query: string; vehicleContext?: { make?: string; model?: string; year?: string; engine?: string } }) => {
		try {
			if (!process.env.PERPLEXITY_API_KEY) {
				return {
					error: 'Perplexity API key not configured',
					content: 'Research functionality is currently unavailable.',
				}
			}

			// Build enhanced query with vehicle context
			const enhancedQuery = vehicleContext
				? `${query} (Vehicle: ${vehicleContext.year || ''} ${vehicleContext.make || ''} ${vehicleContext.model || ''} ${vehicleContext.engine || ''})`
				: query

			// Detect if this is a parts query and use appropriate prompt
			const isParts = isPartsQuery(query)
			const systemPrompt = isParts ? PERPLEXITY_PARTS_PROMPT : PERPLEXITY_DIAGNOSTIC_PROMPT

			const response = await fetch(PERPLEXITY_API_URL, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'sonar-pro',
					messages: [
					{
						role: 'system',
						content: systemPrompt,
					},
						{
							role: 'user',
							content: enhancedQuery,
						},
					],
					stream: false,
					max_tokens: 2000,
					temperature: 0.2,
				}),
			})

			if (!response.ok) {
				const errorText = await response.text()
				return {
					error: `Perplexity API error: ${response.status}`,
					content: 'Unable to perform research at this time.',
				}
			}

			const data = await response.json()
			const rawContent = data.choices?.[0]?.message?.content || 'No research results found.'
			// Strip inline citation references like [1], [2], [1][2], etc.
			// Only collapse multiple spaces on same line, preserve newlines for markdown
			const content = rawContent
				.replace(/\[\d+\]/g, '')
				.replace(/[ \t]+/g, ' ')  // Collapse spaces/tabs only, not newlines
				.trim()
			const citations = data.citations || []
			const searchResults = data.search_results || []

			return {
				content,
				citations,
				searchResults,
				sources: citations.map((cite: string, idx: number) => ({
					id: idx + 1,
					url: cite,
				})),
			}
		} catch (error) {
			console.error('Perplexity research error:', error)
			return {
				error: error instanceof Error ? error.message : 'Unknown error',
				content: 'Research request failed. Please try again.',
			}
		}
	},
})

export const getPerplexityTools = () => ({
	perplexityResearchTool,
})

