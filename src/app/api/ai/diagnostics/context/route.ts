// src/app/api/ai/diagnostics/context/route.ts

import { NextRequest } from 'next/server';
import { getShopIdForUser } from '@/utils/get-shop-id';
import { buildVehicleContext, formatVehicleContextForAI } from '@/app/(features)/ai/AIDiagnostics/tools/context-builder';

/**
 * Vehicle context endpoint
 * GET /api/ai/diagnostics/context?vehicleId=123
 */
export async function GET(req: NextRequest) {
    try {
        // Authenticate user
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Parse query parameters
        const searchParams = req.nextUrl.searchParams;
        const vehicleId = searchParams.get('vehicleId');

        if (!vehicleId) {
            return new Response(
                JSON.stringify({ error: 'vehicleId parameter required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Build vehicle context
        const context = await buildVehicleContext(parseInt(vehicleId), shopId);
        const formattedContext = formatVehicleContextForAI(context);

        return new Response(
            JSON.stringify({
                context,
                formatted: formattedContext,
                summary: {
                    vehicleInfo: context.vehicleInfo,
                    totalWorkOrders: context.workOrders.length,
                    totalInvoices: context.invoices.length,
                    totalAppointments: context.appointments.length
                }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Context builder error:', error);

        const errorMessage = error instanceof Error
            ? error.message
            : 'Failed to build vehicle context';

        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}