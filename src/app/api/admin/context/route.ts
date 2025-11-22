import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Simple in-memory cache for admin context (5 minute TTL)
const adminContextCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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

        // Check cache first
        const cacheKey = user.id
        const cached = adminContextCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data)
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
        // Priority order: super-admin > organization-admin > shop-admin
        let adminType: 'super-admin' | 'organization-admin' | 'shop-admin' | null = null
        let organizationId: string | null = null
        let shopId: string | null = userData.shop_id || null

        // Priority 1: Super Admin - MotorMinds platform admin
        // If role is 'super-admin' or 'SUPER-ADMIN', ALWAYS super-admin (regardless of shop_id/org_id)
        if (userRole === 'SUPER-ADMIN' || userRole === 'SUPER_ADMIN') {
            adminType = 'super-admin'
            // Super admin can have organization_id and shop_id, but they're not limited by them
            organizationId = userData.organization_id || null
        }
        // Priority 2: Organization Admin - MSO admin (has organization_id)
        // If user has organization_id and role is 'admin', they're organization-admin
        else if ((userRole === 'ADMIN' || userRole === 'ORGANIZATION_ADMIN') && userData.organization_id) {
            adminType = 'organization-admin'
            organizationId = userData.organization_id
        }
        // Priority 3: Shop Admin - Shop-level admin (role='admin' without organization_id)
        // If user has role='admin' but no organization_id, they're shop-admin
        else if (userRole === 'ADMIN' || userRole === 'SHOP_ADMIN') {
            adminType = 'shop-admin'
            
            // Get organization from shop if exists (shop might belong to org)
            if (userData.shop_id) {
                const { data: shopData } = await supabase
                    .from('shops')
                    .select('organization_id')
                    .eq('id', userData.shop_id)
                    .single()
                
                if (shopData?.organization_id) {
                    organizationId = shopData.organization_id
                }
            }
        }

        if (!adminType) {
            return NextResponse.json(
                { error: 'Not authorized as admin' },
                { status: 403 }
            )
        }

        const result = {
            adminType,
            organizationId,
            shopId,
            userId: user.id
        }

        // Cache the result
        adminContextCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching admin context:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

