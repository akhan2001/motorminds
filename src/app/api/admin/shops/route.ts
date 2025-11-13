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

        // Check if super admin
        const { searchParams } = new URL(request.url)
        const isSuperAdmin = searchParams.get('super_admin') === 'true'
        
        if (isSuperAdmin) {
            // Verify user is super admin
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()

            const userRole = userData?.role?.toUpperCase()
            const isSuperAdminUser = userRole === 'SUPER-ADMIN' || userRole === 'SUPER_ADMIN'
            
            if (!isSuperAdminUser) {
                return NextResponse.json(
                    { error: 'Forbidden - Super admin access required' },
                    { status: 403 }
                )
            }
        }
        
        // Get all shops with organization info
        const { data: shops, error } = await supabase
            .from('shops')
            .select(`
                *,
                organizations:organizations(id, name)
            `)
            .order('shop_name', { ascending: true });
        
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
