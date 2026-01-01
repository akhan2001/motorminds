import { NextRequest, NextResponse } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        
        const year = searchParams.get('year')
        const vehicleTypes = searchParams.get('vehicleTypes')
        const withRel = searchParams.get('withRel')
        
        if (!year) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Year is required' 
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
        
        const makes = await client.getMakes(parseInt(year, 10), {
            vehicleTypes: vehicleTypes ? vehicleTypes.split(',').map(v => parseInt(v, 10)) : undefined,
            withRel: withRel ? withRel.split(',') : undefined
        })
        
        return NextResponse.json({
            success: true,
            data: makes,
            message: 'Makes fetched successfully'
        })
        
    } catch (error) {
        console.error('[API] Error fetching makes:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const statusCode = error instanceof Error && 'statusCode' in error 
            ? (error as any).statusCode 
            : 500
        
        return NextResponse.json(
            { 
                success: false,
                message: 'Failed to fetch makes',
                error: errorMessage 
            },
            { status: statusCode || 500 }
        )
    }
}

