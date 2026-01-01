import { NextRequest, NextResponse } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        
        const year = searchParams.get('year')
        const makeID = searchParams.get('makeID')
        const modelID = searchParams.get('modelID')
        const vehicleTypes = searchParams.get('vehicleTypes')
        const countryIDs = searchParams.get('countryIDs')
        
        if (!year || !makeID || !modelID) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Year, MakeID, and ModelID are required' 
                },
                { status: 400 }
            )
        }
        
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
        
        const engines = await client.getEngines(
            parseInt(year, 10),
            parseInt(makeID, 10),
            parseInt(modelID, 10),
            {
                vehicleTypes: vehicleTypes ? vehicleTypes.split(',').map(v => parseInt(v, 10)) : undefined,
                countryIDs: countryIDs ? countryIDs.split(',').map(v => parseInt(v, 10)) : undefined
            }
        )
        
        return NextResponse.json({
            success: true,
            data: engines,
            message: 'Engines fetched successfully'
        })
        
    } catch (error) {
        console.error('[API] Error fetching engines:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const statusCode = error instanceof Error && 'statusCode' in error 
            ? (error as any).statusCode 
            : 500
        
        return NextResponse.json(
            { 
                success: false,
                message: 'Failed to fetch engines',
                error: errorMessage 
            },
            { status: statusCode || 500 }
        )
    }
}

