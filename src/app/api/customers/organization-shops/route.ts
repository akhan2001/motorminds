import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser()
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()

        // Get user's shop and organization info
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('organization_id')
            .eq('id', shopId)
            .single()

        if (shopError) {
            console.error('Failed to get shop data:', shopError)
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
        }

        const organizationId = shopData?.organization_id

        // If no organization, return empty shops list
        if (!organizationId) {
            return NextResponse.json({ shops: [] })
        }

        // Get all shops in the organization
        const { data: shops, error: shopsError } = await supabase
            .from('shops')
            .select('id, shop_name, shop_email')
            .eq('organization_id', organizationId)
            .order('shop_name', { ascending: true })

        if (shopsError) {
            console.error('Error fetching organization shops:', shopsError)
            return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 })
        }

        return NextResponse.json({
            shops: shops || []
        })

    } catch (error) {
        console.error('Organization shops API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
