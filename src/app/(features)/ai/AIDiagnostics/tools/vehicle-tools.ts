// src/app/(features)/ai/AIDiagnostics/tools/vehicle-tools.ts

import { tool } from 'ai';
import { z } from 'zod';
import { buildVehicleContext } from '../lib/context-builder';

export const getVehicleHistoryTool = tool<
    { vehicleId: number; shopId: number },
    { success: boolean; data?: unknown; error?: string; message: string; summary?: unknown }
>({
    description: 'Get complete vehicle service history including all work orders, invoices, appointments, and repairs. This provides critical context for diagnosing recurring issues or related problems.',
    inputSchema: z.object({
        vehicleId: z.number().describe('Customer vehicle ID'),
        shopId: z.number().describe('Shop ID for data access')
    }),
    execute: async (args: { vehicleId: number; shopId: number }) => {
        try {
            const context = await buildVehicleContext(args.vehicleId, args.shopId);

            if (!context.vehicleInfo) {
                return {
                    success: false,
                    message: 'Vehicle not found',
                    error: 'No vehicle information available'
                };
            }

            return {
                success: true,
                data: context,
                message: `Retrieved complete history for ${context.vehicleInfo.year} ${context.vehicleInfo.make} ${context.vehicleInfo.model} (VIN: ${context.vehicleInfo.vin})`,
                summary: {
                    totalWorkOrders: context.workOrders.length,
                    totalInvoices: context.invoices.length,
                    totalAppointments: context.appointments.length,
                    currentMileage: context.vehicleInfo.mileage,
                    recentServices: context.workOrders
                        .slice(0, 5)
                        .map(wo => ({
                            date: wo.created_at,
                            description: wo.description || wo.vehicle_concern,
                            status: wo.status
                        }))
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve vehicle history',
                message: 'Could not load vehicle history from CRM'
            };
        }
    }
});