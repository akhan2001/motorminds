import { NextRequest, NextResponse } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ baseVehicleId: string; applicationId: string }> }
) {
	try {
		const params = await context.params
		const { searchParams } = new URL(request.url)

		const publicKey = process.env.MOTOR_DAAS_PUBLIC_KEY
		const privateKey = process.env.MOTOR_DAAS_PRIVATE_KEY

		if (!publicKey || !privateKey) {
			return NextResponse.json(
				{ error: 'MOTOR DaaS credentials not configured' },
				{ status: 500 }
			)
		}

		const client = new MotorDaasClient({
			publicKey,
			privateKey,
			baseUrl: 'https://api.motor.com/v1'
		})

		const baseVehicleId = parseInt(params.baseVehicleId, 10)
		const applicationId = parseInt(params.applicationId, 10)

		if (isNaN(baseVehicleId) || isNaN(applicationId)) {
			return NextResponse.json(
				{ error: 'Invalid baseVehicleId or applicationId' },
				{ status: 400 }
			)
		}

		const engineId = searchParams.get('engineId') ? parseInt(searchParams.get('engineId')!, 10) : undefined
		const details = await client.getWiringDiagramDetails(baseVehicleId, applicationId, engineId)

		// Log the response structure for debugging
		console.log('[API] Wiring diagram details response structure:', {
			hasDocuments: !!details.Documents,
			documentsLength: details.Documents?.length || 0,
			hasBody: !!(details as any).Body,
			hasApplications: !!(details as any).Applications,
			keys: Object.keys(details)
		})

		return NextResponse.json(details)
	} catch (error) {
		console.error('[API] Error fetching wiring diagram details:', error)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500

		return NextResponse.json(
			{ error: errorMessage },
			{ status: statusCode || 500 }
		)
	}
}

