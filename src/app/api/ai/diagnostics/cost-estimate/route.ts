// src/app/api/ai/diagnostics/cost-estimate/route.ts

import { NextRequest } from 'next/server';
import { getShopIdForUser } from '@/utils/get-shop-id';
import { calculateRepairCost, formatCostEstimate } from '@/app/(features)/ai/AIDiagnostics/lib/cost-calculator';

/**
 * Cost estimation endpoint
 * POST /api/ai/diagnostics/cost-estimate
 * Body: { baseVehicleId, operation, parts?, laborHoursOverride? }
 */
export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Parse request body
        const body = await req.json();
        const { baseVehicleId, operation, parts, laborHoursOverride } = body;

        if (!baseVehicleId || !operation) {
            return new Response(
                JSON.stringify({
                    error: 'baseVehicleId and operation are required'
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Calculate cost estimate
        const estimate = await calculateRepairCost({
            baseVehicleId,
            shopId,
            operation,
            parts,
            laborHoursOverride
        });

        // Return both structured data and formatted text
        return new Response(
            JSON.stringify({
                estimate,
                formatted: formatCostEstimate(estimate)
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Cost estimation error:', error);

        const errorMessage = error instanceof Error
            ? error.message
            : 'Failed to calculate cost estimate';

        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}