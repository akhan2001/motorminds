import type { Tool, ToolSet } from 'ai';
import { z } from 'zod';

import type { MotorDaasClient } from './client';

const basicToolSchema = z.custom<Tool>((value) => typeof value === 'object')

/**
 * Schema for validating that a tool set only contains known tools.
 */
export const toolSetValidationSchema = z.record(
    z.enum([
        // TODO: MCP Tools

        // Local tools
        'getVehicleInfo',
        'lookupDTC',
        'getServiceProcedure',
        'getParts',
        'getMaintenanceSchedule',
        'getSpecifications',
        'getWorkTime',
        'getTSB',
        'getWiringDiagrams',
        'getBulkVehicleAttributes',
        'getRecommendedFluids',
    ]),
    basicToolSchema
)
export type ToolName = keyof z.infer<typeof toolSetValidationSchema>

/**
 * Tool categories based on the data they access.
 */
export const TOOL_CATEGORIES = {
    // UI Tools (always available)
    UI: 'ui',

    // MOTOR API Tool
    MOTOR_API: 'motor-api',

    // CRM Tool
    CRM: 'crm',

    // Online Tools
    ONLINE: 'online',
} as const

type ToolCategory = (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES]

/**
 * Mapping of tool names to their categories
 */
export const TOOL_CATEGORY_MAP: Record<string, ToolCategory> = {
    // UI Tools (always available)
    render_diagram: TOOL_CATEGORIES.UI,

    // MOTOR Api Tool
    getVehicleInfo: TOOL_CATEGORIES.MOTOR_API,
    lookupDTC: TOOL_CATEGORIES.MOTOR_API,
    getServiceProcedure: TOOL_CATEGORIES.MOTOR_API,
    getParts: TOOL_CATEGORIES.MOTOR_API,
    getMaintenanceSchedule: TOOL_CATEGORIES.MOTOR_API,
    getSpecifications: TOOL_CATEGORIES.MOTOR_API,
    getWorkTime: TOOL_CATEGORIES.MOTOR_API,
    getTSB: TOOL_CATEGORIES.MOTOR_API,
    getWiringDiagrams: TOOL_CATEGORIES.MOTOR_API,
    getBulkVehicleAttributes: TOOL_CATEGORIES.MOTOR_API,

    // CRM Tool
    getWorkOrder: TOOL_CATEGORIES.CRM,
    getCustomerInfo: TOOL_CATEGORIES.CRM,
    getVehicleHistory: TOOL_CATEGORIES.CRM,
    getAppointment: TOOL_CATEGORIES.CRM,
    getInvoice: TOOL_CATEGORIES.CRM,
    estimateRepairCost: TOOL_CATEGORIES.CRM,

    // Online Tools
    lookupForums: TOOL_CATEGORIES.ONLINE,
    lookupVideos: TOOL_CATEGORIES.ONLINE,
    lookupArticles: TOOL_CATEGORIES.ONLINE,
}


/**
 * Get the minimum opt-in level required for a tool category
 */
function getMinimumOptInLevel(category: ToolCategory): AiOptInLevel | null {
    switch (category) {
        case TOOL_CATEGORIES.UI:
            return null // Always available
        case TOOL_CATEGORIES.MOTOR_API:
            return 'schema'
        case TOOL_CATEGORIES.CRM:
            return 'schema'
        case TOOL_CATEGORIES.ONLINE:
            return 'schema_and_log'
        default:
            return null
    }
}

/**
* Create a privacy message tool that explains why the tool is not available
*/
export function createPrivacyMessageTool(toolInstance: Tool<any, any>) {
    const privacyMessage =
        "You don't have permission to use this tool. This is an organization-wide setting requiring you to opt-in. Please choose your preferred data sharing level in your organization's settings. Supabase Assistant uses Amazon Bedrock, which does not store or log your prompts and completions, use them to train AWS models, or distribute them to third parties. By default, no data is shared. Granting permission allows Supabase to send information (like schema, logs, or data, depending on your chosen level) to Bedrock solely to generate responses."
    const condensedPrivacyMessage =
        'Requires opting in to sending data to Bedrock which does not store, train on, or distribute it. You can opt in via organization settings.'

    return {
        ...toolInstance,
        description: `${toolInstance.description} (Note: ${condensedPrivacyMessage})`,
        execute: async (_args: any, _context: any) => ({ status: privacyMessage }),
    }
}

/**
* Filter tools based on the AI opt-in level
*/
export function filterToolsByOptInLevel(tools: ToolSet): ToolSet {
    return Object.fromEntries(
        Object.entries(tools)
            .filter(([toolName]) => TOOL_CATEGORY_MAP[toolName] !== undefined)
            .map(([toolName, toolInstance]) => {
                return [toolName, toolInstance]
            })
    )
}
