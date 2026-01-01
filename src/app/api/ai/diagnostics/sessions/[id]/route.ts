import { NextRequest, NextResponse } from 'next/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const shopId = await getShopIdForUser()
		if (!shopId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params

		// No storage - return 404 for any session lookup
		return NextResponse.json({ error: 'Session not found' }, { status: 404 })
	} catch (error) {
		console.error('Error in GET /api/ai/diagnostics/sessions/[id]:', error)
		return NextResponse.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const shopId = await getShopIdForUser()
		if (!shopId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params
		const body = await request.json()

		// No storage - return 404
		return NextResponse.json({ error: 'Session not found' }, { status: 404 })
	} catch (error) {
		console.error('Error in PATCH /api/ai/diagnostics/sessions/[id]:', error)
		return NextResponse.json(
			{
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

