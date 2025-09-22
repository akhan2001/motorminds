import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    try {
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

        const body = await request.json()
        const { 
            vehicle_info, 
            parts_requested, 
            supplier_info, 
            priority = 'normal',
            notes,
            customer_notes 
        } = body

        // Validate required fields
        if (!vehicle_info || !parts_requested || !Array.isArray(parts_requested) || parts_requested.length === 0) {
            return NextResponse.json({ 
                error: 'Vehicle info and parts requested are required' 
            }, { status: 400 })
        }

        // Calculate total estimated price (placeholder for now)
        const totalEstimatedPrice = parts_requested.reduce((total: number, part: any) => {
            return total + ((part.estimated_price || 0) * (part.quantity || 1))
        }, 0)

        // Insert parts request into database
        const { data: partsRequest, error: insertError } = await supabase
            .from('parts_requests')
            .insert({
                shop_id: shopId,
                user_id: user.id,
                vehicle_info,
                parts_requested,
                supplier_info: supplier_info || {},
                total_estimated_price: totalEstimatedPrice,
                status: 'pending',
                priority,
                notes,
                customer_notes
            })
            .select()
            .single()

        if (insertError) {
            console.error('Database error:', insertError)
            return NextResponse.json({ 
                error: 'Failed to create parts request',
                details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
            }, { status: 500 })
        }

        console.log('✅ Parts request created successfully:', partsRequest.id)

        return NextResponse.json({
            success: true,
            data: partsRequest,
            message: 'Parts request created successfully'
        })

    } catch (error: any) {
        console.error('❌ Error creating parts request:', error)
        
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
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

        // Get parts requests for this shop
        const { data: partsRequests, error: selectError } = await supabase
            .from('parts_requests')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })

        if (selectError) {
            console.error('Database error:', selectError)
            return NextResponse.json({ 
                error: 'Failed to fetch parts requests',
                details: process.env.NODE_ENV === 'development' ? selectError.message : undefined
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            data: partsRequests || []
        })

    } catch (error: any) {
        console.error('❌ Error fetching parts requests:', error)
        
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 })
    }
}
