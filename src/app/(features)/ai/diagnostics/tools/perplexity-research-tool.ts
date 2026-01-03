// src/app/(features)/ai/diagnostics/tools/perplexity-research-tool.ts

import { tool } from 'ai'
import { z } from 'zod'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

export const perplexityResearchTool = tool({
	description: `PRIMARY DIAGNOSTIC TOOL - Use for most customer complaints and diagnostic questions.

Search real-world sources for:
- Common failures and fixes for specific make/model/year
- TSB lookups and recall info
- Forum-proven solutions
- DTC troubleshooting steps

USE THIS TOOL when user reports symptoms like:
- "rough idle", "check engine light", "no start", "stalling"
- "noise from [location]", "vibration", "hesitation"
- Any DTC code troubleshooting
- "What's the most likely cause of..."

Format query as: "[symptom] [year] [make] [model] common causes" or "[DTC code] [make] fix"`,
	
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
							content: `You're a master tech researching a fix. Find:
1. Most common cause for this specific make/model/year
2. Quick diagnostic test to confirm
3. Known TSBs or recalls
4. What gets missed

Be concise. Lead with the most likely fix. Skip obvious stuff.`,
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
			const content = data.choices?.[0]?.message?.content || 'No research results found.'
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

