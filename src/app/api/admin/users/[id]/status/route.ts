import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await request.json()
        const { status } = body

        if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status provided' },
                { status: 400 }
            )
        }

        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Database connection not configured' },
                { status: 500 }
            )
        }
        
        const { error } = await supabaseAdmin
            .from('users')
            .update({ status })
            .eq('id', id)

        if (error) {
            console.error('Database error updating user status:', error)
            return NextResponse.json(
                { error: 'Failed to update user status in database' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `User status updated to ${status}`
        })
    } catch (error) {
        console.error('Error updating user status:', error)
        return NextResponse.json(
            { error: 'Failed to update user status' },
            { status: 500 }
        )
    }
}

