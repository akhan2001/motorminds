import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const body = await request.json()

        if (!supabaseAdmin) {
            return NextResponse.json(
                { error: 'Database connection not configured' },
                { status: 500 }
            )
        }
        
        // Update user in database
        const { error } = await supabaseAdmin
            .from('users')
            .update({
                role: body.role,
                status: body.status,
                plan: body.plan
            })
            .eq('id', id)

        if (error) {
            console.error('Database error updating user:', error)
            return NextResponse.json(
                { error: 'Failed to update user in database' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'User updated successfully'
        })
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        )
    }
}

