import { NextRequest, NextResponse } from 'next/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

export async function GET(request: NextRequest) {
	try {
		const shopId = await getShopIdForUser()
		if (!shopId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// No storage - return empty sessions list
		return NextResponse.json({ sessions: [] })
	} catch (error) {
		console.error('Error in GET /api/ai/diagnostics/sessions:', error)
		return NextResponse.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const shopId = await getShopIdForUser()
		if (!shopId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { vehicle_context, work_order_id, initial_issue, status } = body

		if (!vehicle_context) {
			return NextResponse.json(
				{ error: 'vehicle_context is required' },
				{ status: 400 }
			)
		}

		// Generate session ID - No storage, just return session ID
		const sessionId = `diag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

		// Return session without saving (in-memory only)
		return NextResponse.json({ 
			session: {
				id: `temp-${sessionId}`,
				session_id: sessionId,
				shop_id: shopId,
				vehicle_context: vehicle_context || {},
				status: status || 'active',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			}
		}, { status: 201 })
	} catch (error) {
		console.error('Error in POST /api/ai/diagnostics/sessions:', error)
		return NextResponse.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

