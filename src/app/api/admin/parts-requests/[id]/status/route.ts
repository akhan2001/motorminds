import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isUserAdmin } from '@/lib/auth/admin-guard'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify user is admin
        const isAdmin = await isUserAdmin(user.id)
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { status, admin_notes } = body

        // Build update data
        const updateData: any = {
            updated_at: new Date().toISOString()
        }

        // Update status if provided
        if (status) {
            if (!['pending', 'processing', 'quoted', 'approved', 'ordered', 'received', 'cancelled'].includes(status)) {
                return NextResponse.json(
                    { error: 'Invalid status provided' },
                    { status: 400 }
                )
            }
            updateData.status = status
        }

        // Update admin notes if provided
        if (admin_notes !== undefined) {
            updateData.admin_notes = admin_notes
        }

        // Ensure at least one field is being updated
        if (!status && admin_notes === undefined) {
            return NextResponse.json(
                { error: 'Either status or admin_notes must be provided' },
                { status: 400 }
            )
        }

        const { data: updatedRequest, error: updateError } = await supabase
            .from('parts_requests')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating parts request status:', updateError)
            return NextResponse.json(
                { error: 'Failed to update parts request status', details: updateError.message },
                { status: 500 }
            )
        }

        const message = status 
            ? `Parts request status updated to ${status}`
            : 'Admin notes updated successfully'

        return NextResponse.json({
            success: true,
            message,
            partsRequest: updatedRequest
        })

    } catch (error) {
        console.error('Error updating parts request status:', error)
        return NextResponse.json(
            { error: 'Failed to update parts request status' },
            { status: 500 }
        )
    }
}
