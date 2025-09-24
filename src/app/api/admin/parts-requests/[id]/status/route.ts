import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const { status, admin_notes } = await request.json()

        const supabase = await createClient()

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // TODO: Add proper admin role checking
        // For now, allow any authenticated user

        // Validate status
        const validStatuses = ['pending', 'processing', 'quoted', 'approved', 'ordered', 'received', 'cancelled']
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Update the parts request
        const updateData: any = {
            status,
            updated_at: new Date().toISOString()
        }

        // Set specific timestamps based on status
        if (status === 'processing') {
            // Add processing timestamp if needed
        } else if (status === 'ordered') {
            updateData.order_placed_at = new Date().toISOString()
        } else if (status === 'received') {
            updateData.fulfilled_at = new Date().toISOString()
        }

        if (admin_notes) {
            updateData.admin_notes = admin_notes
        }

        const { data, error } = await supabase
            .from('parts_requests')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating parts request status:', error)
            return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true, 
            partsRequest: data,
            message: `Status updated to ${status}`
        })

    } catch (error) {
        console.error('Error in admin status update handler:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
