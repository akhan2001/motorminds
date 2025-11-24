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

    // MOTOR Api Tool
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

    lookupForums: TOOL_CATEGORIES.ONLINE,
}
