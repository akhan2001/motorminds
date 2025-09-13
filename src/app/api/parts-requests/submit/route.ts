import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
// import { sendPartsRequestEmailNotification, sendPartsRequestSlackNotification } from '@/lib/notifications/parts-request'

interface PartRequest {
    id: string
    articleId: string
    articleNo: string
    name: string
    description: string
    supplier: string
    supplierId: number
    price: number
    availability: string
    imageUrl?: string
    partNumber: string
    brandName: string
    productId?: number
    mediaType?: string
    mediaFileName?: string
    fullInfo?: any
}

interface VehicleInfo {
    year?: string
    make?: string
    model?: string
    engine?: {
        vehicleId?: string
        engineName?: string
        capacityLt?: string
        numberOfCylinders?: number
    }
}

interface CartSubmissionRequest {
    parts: PartRequest[]
    vehicleInfo: VehicleInfo
    customerNotes?: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get user's shop_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        if (userError || !userData?.shop_id) {
            return NextResponse.json(
                { error: 'Shop information not found' },
                { status: 400 }
            )
        }

        // Parse request body
        const body: CartSubmissionRequest = await request.json()
        
        if (!body.parts || !Array.isArray(body.parts) || body.parts.length === 0) {
            return NextResponse.json(
                { error: 'Parts list is required and cannot be empty' },
                { status: 400 }
            )
        }

        // Calculate total estimated price
        const totalEstimatedPrice = body.parts.reduce((total, part) => {
            return total + (part.price || 0)
        }, 0)

        // Create vehicle info summary
        const vehicleInfoSummary = {
            year: body.vehicleInfo.year,
            make: body.vehicleInfo.make,
            model: body.vehicleInfo.model,
            engine: body.vehicleInfo.engine
        }

        // Insert parts request
        const { data: partsRequest, error: insertError } = await supabase
            .from('parts_requests')
            .insert({
                shop_id: userData.shop_id,
                user_id: user.id,
                vehicle_info: vehicleInfoSummary,
                parts_requested: body.parts,
                total_estimated_price: totalEstimatedPrice,
                customer_notes: body.customerNotes,
                priority: body.priority || 'normal',
                status: 'pending'
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error creating parts request:', insertError)
            return NextResponse.json(
                { error: 'Failed to create parts request' },
                { status: 500 }
            )
        }

        // Create initial message
        const { error: messageError } = await supabase
            .from('parts_request_messages')
            .insert({
                parts_request_id: partsRequest.id,
                user_id: user.id,
                user_role: 'shop_user',
                message: `Parts request submitted with ${body.parts.length} items. Total estimated price: $${totalEstimatedPrice.toFixed(2)} CAD`,
                message_type: 'note'
            })

        if (messageError) {
            console.error('Error creating initial message:', messageError)
            // Don't fail the request if message creation fails
        }

        // Send notifications to admin users (in background)
        notifyAdminUsers(partsRequest, userData.shop_id, supabase)

        return NextResponse.json({
            success: true,
            requestId: partsRequest.id,
            message: 'Parts request submitted successfully',
            data: {
                id: partsRequest.id,
                status: partsRequest.status,
                totalParts: body.parts.length,
                totalEstimatedPrice: totalEstimatedPrice,
                createdAt: partsRequest.created_at
            }
        })

    } catch (error) {
        console.error('Parts request submission error:', error)
        return NextResponse.json(
            { error: 'Failed to process parts request' },
            { status: 500 }
        )
    }
}

// Background function to notify admin users
async function notifyAdminUsers(partsRequest: any, shopId: string, supabase: any) {
    try {
        // Get shop information
        const { data: shopData } = await supabase
            .from('shops')
            .select('shop_name, shop_owner, shop_phone, shop_email')
            .eq('id', shopId)
            .single()

        // Get admin users for in-app notifications
        const { data: adminUsers } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'admin')

        if (adminUsers && adminUsers.length > 0) {
            // Create notification messages for each admin
            const notifications = adminUsers.map((admin: any) => ({
                parts_request_id: partsRequest.id,
                user_id: admin.id,
                user_role: 'admin',
                message: `🔧 NEW PARTS REQUEST from ${shopData?.shop_name || 'Unknown Shop'} - ${partsRequest.parts_requested.length} items, Est. $${partsRequest.total_estimated_price} CAD`,
                message_type: 'notification'
            }))

            await supabase
                .from('parts_request_messages')
                .insert(notifications)

            console.log(`Notified ${adminUsers.length} admin users about new parts request ${partsRequest.id}`)
        }

        // Email and Slack notifications removed - using in-app notifications only
        console.log(`In-app notifications created for parts request ${partsRequest.id}`)

    } catch (error) {
        console.error('Error notifying admin users:', error)
        // Don't throw - this is background notification
    }
}

// GET endpoint to retrieve user's parts requests
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get user's shop_id and role
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id, role')
            .eq('id', user.id)
            .single()

        if (userError) {
            return NextResponse.json(
                { error: 'User information not found' },
                { status: 400 }
            )
        }

        let query = supabase
            .from('parts_requests')
            .select(`
                *,
                parts_request_messages(*)
            `)

        // If user is admin, show all requests, otherwise filter by shop
        if (userData.role !== 'admin') {
            query = query.eq('shop_id', userData.shop_id)
        }

        query = query.order('created_at', { ascending: false })

        const { data: requests, error: fetchError } = await query

        if (fetchError) {
            console.error('Error fetching parts requests:', fetchError)
            return NextResponse.json(
                { error: 'Failed to fetch parts requests' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            requests: requests || []
        })

    } catch (error) {
        console.error('Get parts requests error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch parts requests' },
            { status: 500 }
        )
    }
}
