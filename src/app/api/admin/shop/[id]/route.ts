import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const shopId = params.id
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get user's role and context
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, organization_id, shop_id')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        const userRole = userData.role?.toUpperCase()
        const isSuperAdmin = userRole === 'SUPER-ADMIN' || userRole === 'SUPER_ADMIN'
        const isOrgAdmin = (userRole === 'ADMIN' || userRole === 'ORGANIZATION_ADMIN') && userData.organization_id
        const isShopAdmin = (userRole === 'ADMIN' || userRole === 'SHOP_ADMIN') && userData.shop_id === shopId

        // Check access
        if (!isSuperAdmin && !isOrgAdmin && !isShopAdmin) {
            // If org admin, verify shop belongs to their organization
            if (isOrgAdmin) {
                const { data: shop } = await supabase
                    .from('shops')
                    .select('organization_id')
                    .eq('id', shopId)
                    .single()

                if (shop?.organization_id !== userData.organization_id) {
                    return NextResponse.json(
                        { error: 'Forbidden - Access denied to this shop' },
                        { status: 403 }
                    )
                }
            } else {
                return NextResponse.json(
                    { error: 'Forbidden - Access denied to this shop' },
                    { status: 403 }
                )
            }
        }

        // Get shop with organization info
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select(`
                *,
                organizations:organizations(id, name)
            `)
            .eq('id', shopId)
            .single()

        if (shopError) {
            if (shopError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Shop not found' },
                    { status: 404 }
                )
            }
            throw shopError
        }

        return NextResponse.json({
            shop: {
                ...shop,
                organization_name: shop.organizations?.name || null
            }
        })
    } catch (error) {
        console.error('Error fetching shop:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

