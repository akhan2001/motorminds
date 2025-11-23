import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
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
        const isShopAdmin = (userRole === 'ADMIN' || userRole === 'SHOP_ADMIN') && userData.shop_id

        // Check if super admin query param is set (for super admin pages)
        const { searchParams } = new URL(request.url)
        const superAdminParam = searchParams.get('super_admin') === 'true'
        
        if (superAdminParam && !isSuperAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Super admin access required' },
                { status: 403 }
            )
        }

        let shopsQuery = supabase
            .from('shops')
            .select(`
                *,
                organizations:organizations(id, name)
            `)

        // Filter based on admin context
        if (isSuperAdmin && superAdminParam) {
            // Super admin sees all shops
            // No filter needed
        } else if (isOrgAdmin && userData.organization_id) {
            // Organization admin sees shops in their organization
            shopsQuery = shopsQuery.eq('organization_id', userData.organization_id)
        } else if (isShopAdmin && userData.shop_id) {
            // Shop admin sees only their shop
            shopsQuery = shopsQuery.eq('id', userData.shop_id)
        } else {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            )
        }

        const { data: shops, error } = await shopsQuery.order('shop_name', { ascending: true });
        
        if (error) {
            console.error('Error fetching shops:', error);
            return NextResponse.json(
                { error: 'Failed to fetch shops', details: error.message },
                { status: 500 }
            );
        }
        
        // Format shops with organization name
        const shopsWithStats = (shops || []).map((shop: any) => ({
            ...shop,
            organization_name: shop.organizations?.name || null,
            organization_id: shop.organization_id || null
        }));
        
        return NextResponse.json({
            shops: shopsWithStats,
            total: shopsWithStats.length
        });
        
    } catch (error) {
        console.error('Error in admin shops API:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
