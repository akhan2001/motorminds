import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Retrieve messages for a session
export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient()
		
		// Get shop_id from authenticated user
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		
		// Get shop_id from user metadata or users table
		let shopId = user.user_metadata?.shop_id
		
		if (!shopId) {
			const { data: userData } = await supabase
				.from('users')
				.select('shop_id')
				.eq('id', user.id)
				.single()
			
			shopId = userData?.shop_id
		}

		const { searchParams } = new URL(request.url)
		const sessionId = searchParams.get('sessionId')

		if (!sessionId) {
			return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
		}

		// Handle fallback sessions (for debugging when no shop_id)
		if (sessionId.startsWith('fallback_session_')) {
			return NextResponse.json({ messages: [] })
		}

		if (!shopId) {
			return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
		}

		// Verify session belongs to shop
		const { data: session, error: sessionError } = await supabase
			.from('mia_sessions')
			.select('id')
			.eq('session_id', sessionId)
			.eq('shop_id', shopId)
			.single()

		if (sessionError) {
			console.error('Error verifying session:', sessionError)
			return NextResponse.json({ error: 'Session not found' }, { status: 404 })
		}

		// Get messages for the session
		const { data: messages, error } = await supabase
			.from('mia_messages')
			.select('*')
			.eq('session_id', sessionId)
			.order('created_at', { ascending: true })

		if (error) {
			console.error('Error fetching messages:', error)
			return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
		}

		return NextResponse.json({ messages })
	} catch (error) {
		console.error('Messages GET API error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

// POST - Store a new message
export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient()
		
		// Get shop_id from authenticated user
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		
		// Get shop_id from user metadata or users table
		let shopId = user.user_metadata?.shop_id
		
		if (!shopId) {
			const { data: userData } = await supabase
				.from('users')
				.select('shop_id')
				.eq('id', user.id)
				.single()
			
			shopId = userData?.shop_id
		}

		const { sessionId, role, content, metadata = {} } = await request.json()

		if (!sessionId || !role || !content) {
			return NextResponse.json({
				error: 'Session ID, role, and content are required'
			}, { status: 400 })
		}

		// Handle fallback sessions (for debugging when no shop_id)
		if (sessionId.startsWith('fallback_session_')) {
			return NextResponse.json({
				message: {
					id: `fallback_${Date.now()}`,
					session_id: sessionId,
					role,
					content,
					metadata,
					created_at: new Date().toISOString()
				}
			})
		}

		if (!shopId) {
			return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
		}

		// DISABLED: No longer saves to database
		// Return mock message without saving
		return NextResponse.json({
			message: {
				id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
				session_id: sessionId,
				role,
				content,
				metadata,
				created_at: new Date().toISOString()
			}
		})
	} catch (error) {
		console.error('Messages POST API error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}