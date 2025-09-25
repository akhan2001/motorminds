import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const { quote_provided, actual_cost, status } = await request.json()

        const supabase = await createClient()

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // TODO: Add proper admin role checking
        // For now, allow any authenticated user

        // Validate quote data
        if (!quote_provided) {
            return NextResponse.json({ error: 'Quote data is required' }, { status: 400 })
        }

        // Update the parts request with quote
        const updateData: any = {
            quote_provided,
            status: status || 'quoted',
            updated_at: new Date().toISOString()
        }

        if (actual_cost !== undefined) {
            updateData.actual_cost = actual_cost
            updateData.total_estimated_price = actual_cost
        }

        const { data, error } = await supabase
            .from('parts_requests')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single()

        if (error) {
            console.error('Error updating parts request quote:', error)
            return NextResponse.json({ error: 'Failed to add quote' }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true, 
            partsRequest: data,
            message: 'Quote added successfully'
        })

    } catch (error) {
        console.error('Error in admin quote handler:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
