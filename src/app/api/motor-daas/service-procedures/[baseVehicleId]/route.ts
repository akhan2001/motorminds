import { NextRequest, NextResponse } from 'next/server'
import { MotorDaasClient } from '@/lib/integrations/motor-daas/client'

/**
 * GET /api/motor-daas/service-procedures/[baseVehicleId]
 * Get service procedures summary for a vehicle
 */
export async function GET(
	request: NextRequest,
	context: { params: Promise<{ baseVehicleId: string }> }
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

		if (isNaN(baseVehicleId)) {
			return NextResponse.json(
				{ error: 'Invalid baseVehicleId' },
				{ status: 400 }
			)
		}

		// Parse query parameters
		const searchParams = request.nextUrl.searchParams
		const contentSilosParam = searchParams.get('ContentSilos')
		const engineId = searchParams.get('engineId')
		const searchTerm = searchParams.get('searchTerm')
		const pageIndex = searchParams.get('pageIndex')
		const itemsPerPage = searchParams.get('itemsPerPage')

		const contentSilos = contentSilosParam 
			? contentSilosParam.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n))
			: undefined

		const result = await client.getServiceProceduresSummary(baseVehicleId, {
			contentSilos,
			engineId: engineId ? parseInt(engineId, 10) : undefined,
			searchTerm: searchTerm || undefined,
			pageIndex: pageIndex ? parseInt(pageIndex, 10) : undefined,
			itemsPerPage: itemsPerPage ? parseInt(itemsPerPage, 10) : undefined,
		})

		return NextResponse.json(result)
	} catch (error) {
		console.error('[API] Error fetching service procedures summary:', error)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500

		return NextResponse.json(
			{ error: errorMessage },
			{ status: statusCode || 500 }
		)
	}
}

