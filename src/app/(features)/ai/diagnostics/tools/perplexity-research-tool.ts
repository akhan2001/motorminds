// src/app/(features)/ai/diagnostics/tools/perplexity-research-tool.ts

import { tool } from 'ai'
import { z } from 'zod'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

export const perplexityResearchTool = tool({
	description: `Search online forums, technical documentation, and automotive resources to find detailed information, troubleshooting guides, and community solutions for complex diagnostic questions. Use this when the user asks detailed questions that may benefit from online research or forum discussions.`,
	
	inputSchema: z.object({
		query: z.string().describe('The research query or question to search for'),
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
							content: `You are an automotive diagnostic research assistant. Search online forums, technical documentation, 
								and automotive resources to provide comprehensive answers with citations. Focus on practical solutions, 
								troubleshooting steps, and real-world experiences from automotive forums.`,
						},
						{
							role: 'user',
							content: enhancedQuery,
						},
					],
					stream: false,
					max_tokens: 4000,
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

