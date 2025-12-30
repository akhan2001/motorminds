import type { Tool, ToolSet } from 'ai'
import { z } from 'zod'

const basicToolSchema = z.custom<Tool>((value) => typeof value === 'object')

/**
 * Schema for validating that a tool set only contains known tools.
 */
export const toolSetValidationSchema = z.record(
    z.enum([
        // UI Tools
        'render_diagram',
        'rename_chat',

        // MOTOR API Tools
        'helloWorld',
        'getServiceProcedures',
        'getVehicleInfo',
        'lookupDTC',
        'getServiceProcedure',
        'getParts',
        'getMaintenanceSchedule',
        'getSpecifications',
        'getWorkTime',
        'getTSB',
        'getWiringDiagrams',
        'getOEMComponents',
        'getRelatedWiringDiagrams',
        'getRelatedOEMComponents',
        'getDiagramComponents',
        'getBulkVehicleAttributes',
        'estimateRepairCost',

        // CRM Tools
        'getCustomerInfo',
        'getVehicleHistory',
        'getAppointment',
        'getWorkOrder',
        'getInvoice',

        // Online Tools
        'lookupForums',
        'perplexityResearchTool'
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
    rename_chat: TOOL_CATEGORIES.UI,

    // MOTOR API Tools
    helloWorld: TOOL_CATEGORIES.MOTOR_API,
    getServiceProcedures: TOOL_CATEGORIES.MOTOR_API,
    getVehicleInfo: TOOL_CATEGORIES.MOTOR_API,
    lookupDTC: TOOL_CATEGORIES.MOTOR_API,
    getServiceProcedure: TOOL_CATEGORIES.MOTOR_API,
    getParts: TOOL_CATEGORIES.MOTOR_API,
    getMaintenanceSchedule: TOOL_CATEGORIES.MOTOR_API,
    getSpecifications: TOOL_CATEGORIES.MOTOR_API,
    getWorkTime: TOOL_CATEGORIES.MOTOR_API,
    getTSB: TOOL_CATEGORIES.MOTOR_API,
    getWiringDiagrams: TOOL_CATEGORIES.MOTOR_API,
    getOEMComponents: TOOL_CATEGORIES.MOTOR_API,
    getRelatedWiringDiagrams: TOOL_CATEGORIES.MOTOR_API,
    getRelatedOEMComponents: TOOL_CATEGORIES.MOTOR_API,
    getDiagramComponents: TOOL_CATEGORIES.MOTOR_API,
    getBulkVehicleAttributes: TOOL_CATEGORIES.MOTOR_API,
    estimateRepairCost: TOOL_CATEGORIES.MOTOR_API,

    // CRM Tools
    getCustomerInfo: TOOL_CATEGORIES.CRM,
    getVehicleHistory: TOOL_CATEGORIES.CRM,
    getAppointment: TOOL_CATEGORIES.CRM,
    getWorkOrder: TOOL_CATEGORIES.CRM,
    getInvoice: TOOL_CATEGORIES.CRM,

    // Online Tools
    lookupForums: TOOL_CATEGORIES.ONLINE,
    perplexityResearchTool: TOOL_CATEGORIES.ONLINE,
}

/**
 * AI Opt-in levels for MotorMinds (legacy - kept for compatibility)
 */
export type AiOptInLevel = 'disabled' | 'schema' | 'full'

/**
 * Diagnostic AI Opt-in levels for MotorMinds
 */
export type DiagnosticAiOptInLevel = 
  | 'vehicle_only' 
  | 'vehicle_and_work_orders' 
  | 'full'

/**
 * Get the minimum opt-in level required for a tool category
 */
function getMinimumOptInLevel(category: ToolCategory): DiagnosticAiOptInLevel | null {
    switch (category) {
        case TOOL_CATEGORIES.UI:
            return null // Always available
        case TOOL_CATEGORIES.MOTOR_API:
            return 'vehicle_only' // Requires at least vehicle context
        case TOOL_CATEGORIES.CRM:
            return 'vehicle_and_work_orders' // Requires work order access
        case TOOL_CATEGORIES.ONLINE:
            return 'vehicle_only' // Requires at least vehicle context
        default:
            return null
    }
}

/**
 * Check if a tool is allowed based on the current opt-in level
 */
function isToolAllowed(toolName: string, aiOptInLevel: DiagnosticAiOptInLevel): boolean {
    const category = TOOL_CATEGORY_MAP[toolName]

    // Unknown tools are not allowed
    if (!category) {
        return false
    }

    const minimumLevel = getMinimumOptInLevel(category)

    // UI tools are always allowed
    if (!minimumLevel) {
        return true
    }

    // Check if current opt-in level meets the minimum requirement
    const optInHierarchy: DiagnosticAiOptInLevel[] = ['vehicle_only', 'vehicle_and_work_orders', 'full']

    const currentLevelIndex = optInHierarchy.indexOf(aiOptInLevel)
    const minimumLevelIndex = optInHierarchy.indexOf(minimumLevel)

    return currentLevelIndex >= minimumLevelIndex
}

/**
 * Create a privacy message tool that explains why the tool is not available
 */
export function createPrivacyMessageTool(toolInstance: Tool<any, any>) {
    const privacyMessage =
        "You don't have permission to use this tool. This requires opting in to AI features in your shop settings. Please contact your administrator to enable AI features."

    const condensedPrivacyMessage =
        'Requires opting in to AI features. Contact your administrator to enable.'

    return {
        ...toolInstance,
        description: `${toolInstance.description} (Note: ${condensedPrivacyMessage})`,
        execute: async (_args: any, _context: any) => ({
            status: privacyMessage,
            error: 'PERMISSION_DENIED'
        }),
    }
}

/**
 * Filter tools based on the AI opt-in level
 */
export function filterToolsByOptInLevel(
    tools: ToolSet,
    aiOptInLevel: DiagnosticAiOptInLevel
): ToolSet {
    return Object.fromEntries(
        Object.entries(tools)
            .filter(([toolName]) => TOOL_CATEGORY_MAP[toolName] !== undefined)
            .map(([toolName, toolInstance]) => {
                if (isToolAllowed(toolName, aiOptInLevel)) {
                    return [toolName, toolInstance]
                }

                // If the tool is not allowed, provide a stub that returns a privacy message
                return [toolName, createPrivacyMessageTool(toolInstance)]
            })
    )
}