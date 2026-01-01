import { NextRequest, NextResponse } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        
        const year = searchParams.get('year')
        const makeID = searchParams.get('makeID')
        const vehicleTypes = searchParams.get('vehicleTypes')
        const countryIDs = searchParams.get('countryIDs')
        const withRel = searchParams.get('withRel')
        
        if (!year || !makeID) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Year and MakeID are required' 
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
        
        const models = await client.getModels(
            parseInt(year, 10),
            parseInt(makeID, 10),
            {
                vehicleTypes: vehicleTypes ? vehicleTypes.split(',').map(v => parseInt(v, 10)) : undefined,
                countryIDs: countryIDs ? countryIDs.split(',').map(v => parseInt(v, 10)) : undefined,
                withRel: withRel ? withRel.split(',') : undefined
            }
        )
        
        return NextResponse.json({
            success: true,
            data: models,
            message: 'Models fetched successfully'
        })
        
    } catch (error) {
        console.error('[API] Error fetching models:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const statusCode = error instanceof Error && 'statusCode' in error 
            ? (error as any).statusCode 
            : 500
        
        return NextResponse.json(
            { 
                success: false,
                message: 'Failed to fetch models',
                error: errorMessage 
            },
            { status: statusCode || 500 }
        )
    }
}

