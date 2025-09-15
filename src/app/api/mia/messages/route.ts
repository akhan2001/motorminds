import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

// GET - Retrieve message history for a session
export async function GET(request: NextRequest) {
  try {
    const shopId = await getShopIdForUser()
    if (!shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Verify session belongs to shop
    const { data: session, error: sessionError } = await supabase
      .from('mia_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('shop_id', shopId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from('mia_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Store a new message
export async function POST(request: NextRequest) {
  try {
    const shopId = await getShopIdForUser()
    if (!shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { sessionId, role, content, metadata = {} } = await request.json()

    if (!sessionId || !role || !content) {
      return NextResponse.json({ 
        error: 'Session ID, role, and content are required' 
      }, { status: 400 })
    }

    // Verify session belongs to shop and is active
    const { data: session, error: sessionError } = await supabase
      .from('mia_sessions')
      .select('id, status')
      .eq('session_id', sessionId)
      .eq('shop_id', shopId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 })
    }

    // Store the message
    const { data: message, error: messageError } = await supabase
      .from('mia_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        metadata
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error storing message:', messageError)
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 })
    }

    // Update session timestamp
    await supabase
      .from('mia_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('session_id', sessionId)

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Messages POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
