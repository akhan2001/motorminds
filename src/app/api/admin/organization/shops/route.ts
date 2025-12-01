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

        // Get user's organization_id
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('organization_id, role')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Verify user is organization admin
        const userRole = userData.role?.toUpperCase()
        const isOrgAdmin = (userRole === 'ADMIN' || userRole === 'ORGANIZATION_ADMIN') && userData.organization_id
        
        if (!isOrgAdmin || !userData.organization_id) {
            return NextResponse.json(
                { error: 'Forbidden - Organization admin access required' },
                { status: 403 }
            )
        }

        // Get organization details
        const { data: organization, error: orgError } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('id', userData.organization_id)
            .single()

        // Get all shops for this organization with organization name
        const { data: shops, error: shopsError } = await supabase
            .from('shops')
            .select(`
                *,
                organizations:organization_id (
                    id,
                    name
                )
            `)
            .eq('organization_id', userData.organization_id)
            .order('shop_name', { ascending: true })

        if (shopsError) {
            console.error('Error fetching shops:', shopsError)
            throw shopsError
        }

        // Format shops with organization name
        const formattedShops = (shops || []).map((shop: any) => ({
            ...shop,
            organization_name: shop.organizations?.name || organization?.name || null,
            organization_id: shop.organization_id
        }))

        return NextResponse.json({
            shops: formattedShops,
            organization: organization ? {
                id: organization.id,
                name: organization.name
            } : null
        })
    } catch (error) {
        console.error('Error fetching organization shops:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

