import { NextRequest, NextResponse } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

/**
 * GET /api/motor-daas/service-procedures/[baseVehicleId]/document/[documentId]
 * Get service procedure document (image/PDF)
 */
export async function GET(
	request: NextRequest,
	context: { params: Promise<{ baseVehicleId: string; documentId: string }> }
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
		const documentId = parseInt(params.documentId, 10)

		if (isNaN(baseVehicleId) || isNaN(documentId)) {
			return NextResponse.json(
				{ error: 'Invalid baseVehicleId or documentId' },
				{ status: 400 }
			)
		}

		const { blob, contentType } = await client.getServiceProcedureDocument(baseVehicleId, documentId)

		// Return the blob with proper content type
		return new NextResponse(blob, {
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': `inline; filename="procedure-image-${documentId}"`,
			},
		})
	} catch (error) {
		console.error('[API] Error fetching service procedure document:', error)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500

		return NextResponse.json(
			{ error: errorMessage },
			{ status: statusCode || 500 }
		)
	}
}

