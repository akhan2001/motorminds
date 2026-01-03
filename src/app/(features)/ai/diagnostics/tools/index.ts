/**
 * AI Diagnostics Tool Registry
 * 
 * Following Supabase patterns:
 * - Tools receive context via parameters (dependency injection)
 * - No global state
 * - Tools are stateless
 */

import type { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

// Tool types - using generic since 'ai' package exports vary by version
type ToolSet = Record<string, Record<string, unknown>>
import { getMotorTools } from './motor-tools'
import { getRenderingTools } from './rendering-tools'
import { getPerplexityTools } from './perplexity-research-tool'
import { filterToolsByOptInLevel, type DiagnosticAiOptInLevel } from './tool-filter'

export interface GetToolsParams {
	shopId: string
	vehicleId?: number
	baseVehicleId?: number
	engineId?: number
	vehicleMake?: string
	authorization?: string
	aiOptInLevel: DiagnosticAiOptInLevel
	accessToken?: string
	motorClient: MotorDaasClient
}

export const getTools = async ({
	shopId,
	vehicleId,
	baseVehicleId,
	engineId,
	vehicleMake,
	authorization,
	aiOptInLevel,
	accessToken,
	motorClient,
}: GetToolsParams): Promise<ToolSet> => {
	// 1. Always include rendering tools (UI-only)
	let tools: ToolSet = getRenderingTools()

	// 2. Add MOTOR DaaS tools if we have vehicle context
	if (baseVehicleId && motorClient) {
		const motorTools = getMotorTools({
			baseVehicleId,
			engineId,
			vehicleMake,
			motorClient,
		})

		tools = {
			...tools,
			...motorTools,
		}
	}

	// 3. Add Perplexity research tools
	const perplexityTools = getPerplexityTools()

	tools = {
		...tools,
		...perplexityTools,
	}

	// 4. Filter by opt-in level
	const filteredTools = filterToolsByOptInLevel(tools, aiOptInLevel)

	return filteredTools
}
