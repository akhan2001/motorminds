import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { createClient } from '@/utils/supabase/server'
import type { DiagnosticSessionCreateData, SessionFilters } from '@/app/(features)/ai/diagnostics/types/diagnostic-session'

export async function GET(request: NextRequest) {
	return withAuth(async (req, shopId) => {
		try {
			const supabase = await createClient()
			const { searchParams } = new URL(req.url)

			// Parse query parameters
			const status = searchParams.get('status')
			const search = searchParams.get('search')
			const limit = parseInt(searchParams.get('limit') || '100', 10)
			const offset = parseInt(searchParams.get('offset') || '0', 10)

			const filters: SessionFilters = {
				...(status && { status: status as any }),
				...(search && { search }),
				limit,
				offset,
			}

			// Build query
			let query = supabase
				.from('mia_sessions')
				.select('*')
				.eq('shop_id', shopId)
				.order('created_at', { ascending: false })

			// Apply status filter
			if (filters.status) {
				query = query.eq('status', filters.status)
			}

			// Apply search filter (search in vehicle_context JSONB)
			if (filters.search && filters.search.trim()) {
				const searchTerm = filters.search.trim()
				// Search in vehicle_context JSONB fields
				query = query.or(
					`vehicle_context->>'make'.ilike.%${searchTerm}%,vehicle_context->>'model'.ilike.%${searchTerm}%,vehicle_context->>'vin'.ilike.%${searchTerm}%`
				)
			}

			// Apply pagination
			query = query.range(offset, offset + limit - 1)

			const { data, error } = await query

			if (error) {
				console.error('Error fetching diagnostic sessions:', error)
				return NextResponse.json(
					{ error: 'Failed to fetch diagnostic sessions', message: error.message },
					{ status: 500 }
				)
			}

			return NextResponse.json({ sessions: data || [] })
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
	})(request)
}

export async function POST(request: NextRequest) {
	return withAuth(async (req, shopId) => {
		try {
			const supabase = await createClient()

			// Get current user
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser()

			if (authError || !user) {
				return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
			}

			const body = await req.json()
			const { vehicle_context, work_order_id, initial_issue, status } = body

			if (!vehicle_context) {
				return NextResponse.json(
					{ error: 'vehicle_context is required' },
					{ status: 400 }
				)
			}

			// Generate session ID
			const sessionId = `diag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

			const { data, error } = await supabase
				.from('mia_sessions')
				.insert({
					session_id: sessionId,
					shop_id: shopId,
					vehicle_context: vehicle_context || {},
					status: status || 'active',
				})
				.select()
				.single()

			if (error) {
				console.error('Error creating diagnostic session:', error)
				return NextResponse.json(
					{ error: 'Failed to create diagnostic session', message: error.message },
					{ status: 500 }
				)
			}

			return NextResponse.json({ session: data }, { status: 201 })
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
	})(request)
}

