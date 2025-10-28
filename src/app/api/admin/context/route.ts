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

        // Get user details with organization context
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
                id,
                role,
                shop_id,
                organization_id
            `)
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        const userRole = userData.role?.toUpperCase()

        // Determine admin type based on role and context
        let adminType: 'super-admin' | 'organization-admin' | 'shop-admin' | null = null
        let organizationId: string | null = null
        let shopId: string | null = null

        // Super Admin - MotorMinds platform admin (no organization)
        if (userRole === 'ADMIN' && !userData.organization_id && !userData.shop_id) {
            adminType = 'super-admin'
        }
        // Organization Admin - MSO admin (has organization but can access multiple shops)
        else if (userRole === 'ADMIN' && userData.organization_id) {
            adminType = 'organization-admin'
            organizationId = userData.organization_id
        }
        // Shop Admin - Shop-level admin (has specific shop)
        else if ((userRole === 'ADMIN' || userRole === 'SHOP_ADMIN') && userData.shop_id) {
            adminType = 'shop-admin'
            shopId = userData.shop_id
            
            // Get organization from shop if exists
            const { data: shopData } = await supabase
                .from('shops')
                .select('organization_id')
                .eq('id', userData.shop_id)
                .single()
            
            if (shopData?.organization_id) {
                organizationId = shopData.organization_id
            }
        }

        if (!adminType) {
            return NextResponse.json(
                { error: 'Not authorized as admin' },
                { status: 403 }
            )
        }

        return NextResponse.json({
            adminType,
            organizationId,
            shopId,
            userId: user.id
        })
    } catch (error) {
        console.error('Error fetching admin context:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

