import { ToolSet } from 'ai'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'
import { getMotorTools } from './motor-daas-tools'
import { getRenderingTools } from './rendering-tools'
import { filterToolsByOptInLevel } from './tool-filter'

type AiOptInLevel = 'disabled' | 'schema' | 'full'

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
    aiOptInLevel: AiOptInLevel
    accessToken?: string
    motorClient: MotorDaasClient
}): ToolSet => {
    // 1. Always include rendering tools (UI-only)
    let tools: ToolSet = getRenderingTools()

    // 2. Add MOTOR DaaS tools
    const motorTools = getMotorTools()

    tools = {
        ...tools,
        ...motorTools,
    }

    // 3. Filter by opt-in level
    const filteredTools = filterToolsByOptInLevel(tools, aiOptInLevel)

    return filteredTools
}