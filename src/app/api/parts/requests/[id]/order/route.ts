import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const { status } = await request.json()

        // Validate input
        if (!id) {
            return NextResponse.json({ error: 'Parts request ID is required' }, { status: 400 })
        }

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Update the parts request status
        const { data, error } = await supabase
            .from('parts_requests')
            .update({
                status,
                order_placed_at: status === 'ordered' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating parts request:', error)
            return NextResponse.json({ error: 'Failed to update parts request' }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true, 
            partsRequest: data,
            message: 'Parts request updated successfully'
        })

    } catch (error) {
        console.error('Error in parts request order handler:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
