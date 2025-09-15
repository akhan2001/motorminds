import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

// GET - Get current active session or create new one
export async function GET(request: NextRequest) {
  try {
    const shopId = await getShopIdForUser()
    if (!shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Check for existing active session
    const { data: existingSession, error: fetchError } = await supabase
      .from('mia_sessions')
      .select('*')
      .eq('shop_id', shopId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (existingSession && !fetchError) {
      return NextResponse.json({ session: existingSession })
    }

    // Create new session if none exists
    const sessionId = crypto.randomUUID()
    const { data: newSession, error: createError } = await supabase
      .from('mia_sessions')
      .insert({
        shop_id: shopId,
        session_id: sessionId,
        vehicle_context: {},
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating session:', createError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({ session: newSession })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update session (vehicle context, etc.)
export async function PUT(request: NextRequest) {
  try {
    const shopId = await getShopIdForUser()
    if (!shopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { sessionId, vehicleContext, status } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (vehicleContext !== undefined) {
      updateData.vehicle_context = vehicleContext
    }

    if (status !== undefined) {
      updateData.status = status
    }

    const { data: updatedSession, error } = await supabase
      .from('mia_sessions')
      .update(updateData)
      .eq('session_id', sessionId)
      .eq('shop_id', shopId)
      .select()
      .single()

    if (error) {
      console.error('Error updating session:', error)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - End session (mark as ended, don't delete messages)
export async function DELETE(request: NextRequest) {
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

    // Mark session as ended (soft delete)
    const { error } = await supabase
      .from('mia_sessions')
      .update({ 
        status: 'ended',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('shop_id', shopId)

    if (error) {
      console.error('Error ending session:', error)
      return NextResponse.json({ error: 'Failed to end session' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Session ended successfully' })
  } catch (error) {
    console.error('Session delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
