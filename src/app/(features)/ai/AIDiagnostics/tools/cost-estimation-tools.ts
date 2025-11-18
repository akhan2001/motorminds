// src/app/(features)/ai/AIDiagnostics/tools/cost-estimation-tools.ts

import { tool } from 'ai'
import { z } from 'zod';
import { calculateRepairCost } from '../lib/cost-calculator';

export const estimateRepairCostTool = tool<
    { baseVehicleId: number; shopId: number; operation: string; parts?: Array<{ partNumber: string; description: string; quantity: number; unitPrice?: number }>; laborHoursOverride?: number },
    { success: boolean; data?: unknown; error?: string; message: string }
>({
    description: 'Calculate estimated repair cost including labor and parts. Provides min/max range based on MOTOR labor times and shop rates.',
    inputSchema: z.object({
        baseVehicleId: z.number().describe('Base vehicle ID from MOTOR DaaS'),
        shopId: z.number().describe('Shop ID to get hourly labor rate'),
        operation: z.string().describe('Repair operation description (e.g., "brake pad replacement")'),
        parts: z.array(z.object({
            partNumber: z.string().describe('Part number'),
            description: z.string().describe('Part description'),
            quantity: z.number().describe('Quantity needed'),
            unitPrice: z.number().optional().describe('Unit price if known')
        })).optional().describe('List of parts required for the repair'),
        laborHoursOverride: z.number().optional().describe('Override labor hours if known (otherwise will look up from MOTOR)')
    }),
    execute: async ({ baseVehicleId, shopId, operation, parts, laborHoursOverride }: { baseVehicleId: number, shopId: number, operation: string, parts: { partNumber: string, description: string, quantity: number, unitPrice?: number }[], laborHoursOverride?: number }) => {
        try {
            const estimate = await calculateRepairCost({
                baseVehicleId,
                shopId,
                operation,
                parts,
                laborHoursOverride
            });

            return {
                success: true,
                data: estimate,
                message: `Cost estimate: $${estimate.total.min.toFixed(2)} - $${estimate.total.max.toFixed(2)}`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to calculate cost',
                message: 'Could not generate cost estimate'
            };
        }
    }
});