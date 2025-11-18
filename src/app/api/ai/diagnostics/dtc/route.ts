// src/app/api/ai/diagnostics/dtc/route.ts

import { NextRequest } from 'next/server';
import { getShopIdForUser } from '@/utils/get-shop-id';
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client';

const motorClient = new MotorDaasClient({
    publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
    privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
    baseUrl: 'https://api.motor.com/v1'
});

/**
 * Quick DTC lookup endpoint
 * GET /api/ai/diagnostics/dtc?baseVehicleId=123&code=P0420&testShopId=xxx (dev only)
 */
export async function GET(req: NextRequest) {
    try {
        // Allow testShopId in development mode
        const searchParams = req.nextUrl.searchParams;
        const testShopId = searchParams.get('testShopId');
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        let shopId: string | null;
        if (isDevelopment && testShopId) {
            shopId = testShopId;
        } else {
            shopId = await getShopIdForUser();
        }
        
        if (!shopId) {
            return new Response(
                JSON.stringify({ 
                    error: 'Unauthorized',
                    ...(isDevelopment && {
                        hint: 'In development mode, you can pass testShopId as a query parameter'
                    })
                }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Parse query parameters
        const baseVehicleId = searchParams.get('baseVehicleId');
        const dtcCode = searchParams.get('code');

        if (!baseVehicleId) {
            return new Response(
                JSON.stringify({ error: 'baseVehicleId parameter required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Look up DTC
        const result = await motorClient.getDiagnosticTroubleCodes(
            parseInt(baseVehicleId),
            dtcCode || undefined
        );

        return new Response(
            JSON.stringify(result),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('DTC lookup error:', error);

        const errorMessage = error instanceof Error
            ? error.message
            : 'Failed to lookup DTC code';

        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}