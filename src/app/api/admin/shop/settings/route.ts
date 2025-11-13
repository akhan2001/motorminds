import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get user's shop_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id, role')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Verify user is shop admin
        const userRole = userData.role?.toUpperCase()
        const isShopAdmin = (userRole === 'ADMIN' || userRole === 'SHOP_ADMIN') && userData.shop_id
        
        if (!isShopAdmin || !userData.shop_id) {
            return NextResponse.json(
                { error: 'Forbidden - Shop admin access required' },
                { status: 403 }
            )
        }

        // Get shop settings
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('*')
            .eq('id', userData.shop_id)
            .single()

        if (shopError) {
            throw shopError
        }

        return NextResponse.json({
            settings: {
                shop_name: shop.shop_name,
                shop_email: shop.shop_email,
                shop_phone: shop.shop_phone,
                shop_address: shop.shop_address,
                shop_city: shop.shop_city,
                shop_province: shop.shop_province,
                shop_owner: shop.shop_owner,
                shop_about: shop.shop_about,
                shop_tagline: shop.shop_tagline,
                default_hourly_rate: shop.default_hourly_rate,
                website: shop.website,
                business_number: shop.business_number,
                hst_number: shop.hst_number,
                operating_hours: shop.operating_hours,
                services_offered: shop.services_offered,
                widget_config: shop.widget_config,
                status_tracker_presets: shop.status_tracker_presets
            }
        })
    } catch (error) {
        console.error('Error fetching shop settings:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get user's shop_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id, role')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Verify user is shop admin
        const userRole = userData.role?.toUpperCase()
        const isShopAdmin = (userRole === 'ADMIN' || userRole === 'SHOP_ADMIN') && userData.shop_id
        
        if (!isShopAdmin || !userData.shop_id) {
            return NextResponse.json(
                { error: 'Forbidden - Shop admin access required' },
                { status: 403 }
            )
        }

        // Update shop settings
        const { data: shop, error: updateError } = await supabase
            .from('shops')
            .update({
                shop_name: body.shop_name,
                shop_email: body.shop_email,
                shop_phone: body.shop_phone,
                shop_address: body.shop_address,
                shop_city: body.shop_city,
                shop_province: body.shop_province,
                shop_owner: body.shop_owner,
                shop_about: body.shop_about,
                shop_tagline: body.shop_tagline,
                default_hourly_rate: body.default_hourly_rate,
                website: body.website,
                business_number: body.business_number,
                hst_number: body.hst_number,
                operating_hours: body.operating_hours,
                services_offered: body.services_offered,
                widget_config: body.widget_config,
                status_tracker_presets: body.status_tracker_presets
            })
            .eq('id', userData.shop_id)
            .select()
            .single()

        if (updateError) {
            throw updateError
        }

        return NextResponse.json({
            success: true,
            settings: {
                shop_name: shop.shop_name,
                shop_email: shop.shop_email,
                shop_phone: shop.shop_phone,
                shop_address: shop.shop_address,
                shop_city: shop.shop_city,
                shop_province: shop.shop_province,
                shop_owner: shop.shop_owner,
                shop_about: shop.shop_about,
                shop_tagline: shop.shop_tagline,
                default_hourly_rate: shop.default_hourly_rate,
                website: shop.website,
                business_number: shop.business_number,
                hst_number: shop.hst_number,
                operating_hours: shop.operating_hours,
                services_offered: shop.services_offered,
                widget_config: shop.widget_config,
                status_tracker_presets: shop.status_tracker_presets
            }
        })
    } catch (error) {
        console.error('Error updating shop settings:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

