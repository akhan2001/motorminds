import { NextRequest, NextResponse } from 'next/server';
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const baseVehicleId = parseInt(searchParams.get('baseVehicleId') || '26332');
        const engineId = searchParams.get('engineId') ? parseInt(searchParams.get('engineId')!) : undefined;
        const submodelId = searchParams.get('submodelId') ? parseInt(searchParams.get('submodelId')!) : undefined;
        const contentSilos = searchParams.get('contentSilos');
        const includeImages = searchParams.get('includeImages') === 'true';

        const motorClient = new MotorDaasClient({
            publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
            privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
            baseUrl: 'https://api.motor.com/v1'
        });

        const result = await motorClient.getRecommendedFluids(
            baseVehicleId,
            engineId,
            submodelId,
            {
                contentSilos: contentSilos ? [parseInt(contentSilos)] : undefined,
                include: includeImages ? ['Image'] : undefined
            }
        );

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'An error occurred',
            details: error
        }, { status: 500 });
    }
}

