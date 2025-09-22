import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        
        // Get user and shop ID for security
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const shopId = request.headers.get('x-shop-id') || user.user_metadata?.shop_id
        if (!shopId) {
            return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
        }

        // Get the specific parts request
        const { data: partsRequest, error: selectError } = await supabase
            .from('parts_requests')
            .select('*')
            .eq('id', id)
            .eq('shop_id', shopId)
            .single()

        if (selectError) {
            if (selectError.code === 'PGRST116') {
                return NextResponse.json({ 
                    error: 'Parts request not found' 
                }, { status: 404 })
            }
            
            console.error('Database error:', selectError)
            return NextResponse.json({ 
                error: 'Failed to fetch parts request',
                details: process.env.NODE_ENV === 'development' ? selectError.message : undefined
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data: partsRequest
        })

    } catch (error: any) {
        console.error('❌ Error fetching parts request:', error)
        
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 })
    }
}
