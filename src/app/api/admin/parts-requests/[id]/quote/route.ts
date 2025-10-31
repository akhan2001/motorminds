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
        const { quote_provided, actual_cost, status } = body

        // Build update data
        const updateData: any = {
            updated_at: new Date().toISOString()
        }

        if (quote_provided !== undefined) {
            updateData.quote_provided = quote_provided
        }

        if (actual_cost !== undefined) {
            updateData.actual_cost = actual_cost
        }

        if (status) {
            updateData.status = status
        }

        const { data: updatedRequest, error: updateError } = await supabase
            .from('parts_requests')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating parts request quote:', updateError)
            return NextResponse.json(
                { error: 'Failed to update parts request quote', details: updateError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Quote updated successfully',
            partsRequest: updatedRequest
        })

    } catch (error) {
        console.error('Error updating parts request quote:', error)
        return NextResponse.json(
            { error: 'Failed to update parts request quote' },
            { status: 500 }
        )
    }
}
