import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { createClient } from '@/utils/supabase/server'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	return withAuth(async (req, shopId) => {
		try {
			const supabase = await createClient()
			const { id } = await params

			const { data, error } = await supabase
				.from('mia_sessions')
				.select('*')
				.eq('shop_id', shopId)
				.eq('session_id', id)
				.single()

			if (error) {
				if (error.code === 'PGRST116') {
					return NextResponse.json({ error: 'Session not found' }, { status: 404 })
				}
				console.error('Error fetching diagnostic session:', error)
				return NextResponse.json(
					{ error: 'Failed to fetch diagnostic session', message: error.message },
					{ status: 500 }
				)
			}

			// Fetch messages for this session
			const { data: messages, error: messagesError } = await supabase
				.from('mia_messages')
				.select('*')
				.eq('session_id', id)
				.order('created_at', { ascending: true })

			if (messagesError) {
				console.error('Error fetching session messages:', messagesError)
				// Don't fail if messages can't be fetched
			}

			return NextResponse.json({
				session: data,
				messages: messages || [],
			})
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
	})(request)
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	return withAuth(async (req, shopId) => {
		try {
			const supabase = await createClient()
			const { id } = await params
			const body = await req.json()

			const updateData: any = {
				updated_at: new Date().toISOString(),
			}

			if (body.status !== undefined) {
				updateData.status = body.status
			}
			// Note: Store optional fields in metadata if columns don't exist
			if (body.ai_recommendation !== undefined || body.initial_issue !== undefined || body.work_order_id !== undefined) {
				// Fetch existing session to preserve metadata
				const { data: existingSession } = await supabase
					.from('mia_sessions')
					.select('metadata')
					.eq('shop_id', shopId)
					.eq('session_id', id)
					.single()
				
				const existingMetadata = existingSession?.metadata || {}
				updateData.metadata = { ...existingMetadata }
				
				if (body.ai_recommendation !== undefined) {
					updateData.metadata.ai_recommendation = body.ai_recommendation
				}
				if (body.initial_issue !== undefined) {
					updateData.metadata.initial_issue = body.initial_issue
				}
				if (body.work_order_id !== undefined) {
					updateData.metadata.work_order_id = body.work_order_id
				}
			}

			const { data, error } = await supabase
				.from('mia_sessions')
				.update(updateData)
				.eq('shop_id', shopId)
				.eq('session_id', id)
				.select()
				.single()

			if (error) {
				if (error.code === 'PGRST116') {
					return NextResponse.json({ error: 'Session not found' }, { status: 404 })
				}
				console.error('Error updating diagnostic session:', error)
				return NextResponse.json(
					{ error: 'Failed to update diagnostic session', message: error.message },
					{ status: 500 }
				)
			}

			return NextResponse.json({ session: data })
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
	})(request)
}

