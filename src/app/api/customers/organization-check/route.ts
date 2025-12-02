import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser()
        if (!shopId) {
            return NextResponse.json({ hasOrganizationAccess: false })
        }

        const supabase = await createClient()

        // Get user's shop and check if it has an organization
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('organization_id')
            .eq('id', shopId)
            .single()

        if (shopError || !shopData) {
            return NextResponse.json({ hasOrganizationAccess: false })
        }

        // If shop has organization_id, user can access organization features
        const hasOrganizationAccess = !!shopData.organization_id

        return NextResponse.json({ 
            hasOrganizationAccess,
            organizationId: shopData.organization_id 
        })

    } catch (error) {
        // Safe fallback - if anything fails, default to no organization access
        return NextResponse.json({ hasOrganizationAccess: false })
    }
}
