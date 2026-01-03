import { NextRequest, NextResponse } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        
        const year = searchParams.get('year')
        const makeID = searchParams.get('makeID')
        const modelID = searchParams.get('modelID')
        
        if (!year || !makeID || !modelID) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Year, MakeID, and ModelID are required' 
                },
                { status: 400 }
            )
        }
        
        console.log('[API] Fetching base vehicle for:', { year, makeID, modelID })
        
        const publicKey = process.env.MOTOR_DAAS_PUBLIC_KEY
        const privateKey = process.env.MOTOR_DAAS_PRIVATE_KEY
        
        if (!publicKey || !privateKey) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'MOTOR DaaS credentials not configured' 
                },
                { status: 500 }
            )
        }
        
        const client = new MotorDaasClient({
            publicKey,
            privateKey,
            baseUrl: 'https://api.motor.com/v1'
        })
        
        const baseVehicle = await client.getBaseVehicle(
            parseInt(year, 10),
            parseInt(makeID, 10),
            parseInt(modelID, 10)
        )
        
        console.log('[API] Base vehicle result:', baseVehicle)
        
        if (!baseVehicle?.BaseVehicleID) {
            console.log('[API] No base vehicle found')
            return NextResponse.json({
                success: false,
                data: null,
                baseVehicleId: null,
                message: 'No base vehicle found for this YMME combination'
            })
        }
        
        console.log('[API] Returning base vehicle ID:', baseVehicle.BaseVehicleID)
        return NextResponse.json({
            success: true,
            data: baseVehicle,
            baseVehicleId: baseVehicle.BaseVehicleID,
            message: 'Base vehicle fetched successfully'
        })
        
    } catch (error) {
        console.error('[API] Error fetching base vehicle:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const statusCode = error instanceof Error && 'statusCode' in error 
            ? (error as any).statusCode 
            : 500
        
        return NextResponse.json(
            { 
                success: false,
                message: 'Failed to fetch base vehicle',
                error: errorMessage 
            },
            { status: statusCode || 500 }
        )
    }
}

