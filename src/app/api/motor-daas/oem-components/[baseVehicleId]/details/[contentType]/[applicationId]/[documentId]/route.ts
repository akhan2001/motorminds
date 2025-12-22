import { NextRequest, NextResponse } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ baseVehicleId: string; contentType: string; applicationId: string; documentId: string }> }
) {
	try {
		const params = await context.params

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
		const contentType = params.contentType
		const applicationId = parseInt(params.applicationId, 10)
		const documentId = parseInt(params.documentId, 10)

		if (isNaN(baseVehicleId) || isNaN(applicationId) || isNaN(documentId)) {
			return NextResponse.json(
				{ error: 'Invalid baseVehicleId, applicationId, or documentId' },
				{ status: 400 }
			)
		}

		const details = await client.getOEMComponentsDetailListByApplicationAndDocument(
			baseVehicleId,
			contentType,
			applicationId,
			documentId
		)

		return NextResponse.json(details)
	} catch (error) {
		console.error('[API] Error fetching OEM components detail list:', error)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500

		return NextResponse.json(
			{ error: errorMessage },
			{ status: statusCode || 500 }
		)
	}
}

