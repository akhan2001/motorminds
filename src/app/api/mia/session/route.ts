import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - Get or create a session
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const shopId = request.headers.get('x-shop-id')
        const userId = request.headers.get('x-user-id')

        if (!shopId) {
            console.error('Missing shop ID in request headers')
            // TEMPORARY: For debugging, create a fallback session without shop_id requirement
            const fallbackSessionId = `fallback_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            
            return NextResponse.json({ 
                session: {
                    id: 'fallback',
                    session_id: fallbackSessionId,
                    shop_id: null,
                    vehicle_context: {},
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            })
        }

        const { searchParams } = new URL(request.url)
        const sessionId = searchParams.get('sessionId')

        if (sessionId) {
            // Get existing session
            const { data: session, error } = await supabase
                .from('mia_sessions')
                .select('*')
                .eq('session_id', sessionId)
                .eq('shop_id', shopId)
                .single()

            if (error) {
                console.error('Error fetching session:', error)
                // If session not found, create a new one instead of returning error
                const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                
                const { data: newSession, error: createError } = await supabase
                    .from('mia_sessions')
                    .insert({
                        session_id: newSessionId,
                        shop_id: shopId,
                        vehicle_context: {},
                        status: 'active'
                    })
                    .select()
                    .single()

                if (createError) {
                    console.error('Error creating replacement session:', createError)
                    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
                }

                return NextResponse.json({ session: newSession })
            }

            return NextResponse.json({ session })
        } else {
            // Create new session
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            
            const { data: session, error } = await supabase
                .from('mia_sessions')
                .insert({
                    session_id: newSessionId,
                    shop_id: shopId,
                    vehicle_context: {},
                    status: 'active'
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating session:', error)
                console.error('Supabase error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                })
                return NextResponse.json({ 
                    error: 'Failed to create session', 
                    details: error.message 
                }, { status: 500 })
            }

            return NextResponse.json({ session })
        }
    } catch (error) {
        console.error('Session API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT - Update session
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const shopId = request.headers.get('x-shop-id')

        if (!shopId) {
            return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
        }

        const { sessionId, vehicle_context, status } = await request.json()

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }

        const updateData: any = {
            updated_at: new Date().toISOString()
        }

        if (vehicle_context !== undefined) {
            updateData.vehicle_context = vehicle_context
        }

        if (status !== undefined) {
            updateData.status = status
        }

        const { data: session, error } = await supabase
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

        return NextResponse.json({ session })
    } catch (error) {
        console.error('Session update API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}