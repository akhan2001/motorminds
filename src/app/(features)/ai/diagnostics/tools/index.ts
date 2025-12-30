import { ToolSet } from 'ai'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'
import { getMotorTools } from './motor-daas-tools'
import { getRenderingTools } from './rendering-tools'
import { getPerplexityTools } from './perplexity-research-tool'
import { filterToolsByOptInLevel, type DiagnosticAiOptInLevel } from './tool-filter'

export const getTools = async ({
    shopId,
    vehicleId,
    authorization,
    aiOptInLevel,
    accessToken,
    motorClient,
}: {
    shopId: string
    vehicleId?: number
    authorization?: string
    aiOptInLevel: DiagnosticAiOptInLevel
    accessToken?: string
    motorClient: MotorDaasClient
}): ToolSet => {
    // 1. Always include rendering tools (UI-only)
    let tools: ToolSet = getRenderingTools()

    // 2. Add MOTOR DaaS tools
    const motorTools = getMotorTools()

    // 3. Add Perplexity research tools
    const perplexityTools = getPerplexityTools()

    tools = {
        ...tools,
        ...motorTools,
        ...perplexityTools,
    }

    // 4. Filter by opt-in level
    const filteredTools = filterToolsByOptInLevel(tools, aiOptInLevel)

    return filteredTools
}