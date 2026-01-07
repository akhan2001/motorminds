import { NextRequest } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const baseVehicleId = searchParams.get('baseVehicleId')

        if (!baseVehicleId) {
            return Response.json(
                { error: 'baseVehicleId is required' },
                { status: 400 }
            )
        }

        // Validate MOTOR DaaS credentials
        if (!process.env.MOTOR_DAAS_PUBLIC_KEY || !process.env.MOTOR_DAAS_PRIVATE_KEY) {
            return Response.json(
                { error: 'MOTOR DaaS credentials not configured' },
                { status: 500 }
            )
        }

        // Create MOTOR DaaS client
        const motorClient = new MotorDaasClient({
            publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY,
            privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY,
            baseUrl: 'https://api.motor.com/v1',
        })

        // Fetch engines from MOTOR DaaS
        const engines = await motorClient.getEngines(parseInt(baseVehicleId, 10))

        return Response.json({ engines: engines || [] })
    } catch (error) {
        console.error('Error fetching engines from MOTOR DaaS:', error)
        return Response.json(
            {
                error: 'Failed to fetch engines',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}
