import { NextRequest, NextResponse } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        
        const min = searchParams.get('min')
        const max = searchParams.get('max')
        const vehicleTypes = searchParams.get('vehicleTypes')
        const withRel = searchParams.get('withRel')
        
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
        
        const years = await client.getYears({
            min: min ? parseInt(min, 10) : undefined,
            max: max ? parseInt(max, 10) : undefined,
            vehicleTypes: vehicleTypes ? vehicleTypes.split(',').map(v => parseInt(v, 10)) : undefined,
            withRel: withRel ? withRel.split(',') : undefined
        })
        
        return NextResponse.json({
            success: true,
            data: years,
            message: 'Years fetched successfully'
        })
        
    } catch (error) {
        console.error('[API] Error fetching years:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const statusCode = error instanceof Error && 'statusCode' in error 
            ? (error as any).statusCode 
            : 500
        
        return NextResponse.json(
            { 
                success: false,
                message: 'Failed to fetch years',
                error: errorMessage 
            },
            { status: statusCode || 500 }
        )
    }
}

