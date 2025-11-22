import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            console.error('Supabase admin client not configured')
            return NextResponse.json(
                { error: 'Database connection not configured' },
                { status: 500 }
            )
        }

        const supabase = await createClient()
        
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

        // Build query based on admin context
        let usersQuery = supabaseAdmin
            .from('users')
            .select(`
                id,
                created_at,
                role,
                shop_id,
                organization_id,
                plan,
                status,
                shops(
                    id,
                    shop_name
                )
            `)

        // Filter based on admin context
        if (isSuperAdmin) {
            // Super admin sees all users
            // No filter needed
        } else if (isOrgAdmin && userData.organization_id) {
            // Organization admin sees users in their organization
            // Get all shop IDs in organization
            const { data: orgShops } = await supabase
                .from('shops')
                .select('id')
                .eq('organization_id', userData.organization_id)
            
            const shopIds = orgShops?.map(shop => shop.id) || []
            
            // Users directly linked to organization OR linked through shops
            usersQuery = usersQuery.or(
                `organization_id.eq.${userData.organization_id},shop_id.in.(${shopIds.join(',')})`
            )
        } else if (isShopAdmin && userData.shop_id) {
            // Shop admin sees only users in their shop
            usersQuery = usersQuery.eq('shop_id', userData.shop_id)
        } else {
            return NextResponse.json(
                { error: 'Forbidden - Admin access required' },
                { status: 403 }
            )
        }

        const { data: users, error } = await usersQuery.order('created_at', { ascending: false })

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({
                success: true,
                users: []
            })
        }

        // Transform the data to match the frontend interface
        const transformedUsers = await Promise.all(
            (users || []).map(async (user: any) => {
                // Fetch auth user data
                let email = ''
                let fullName = ''
                
                try {
                    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user.id)
                    if (!authError && authUser.user) {
                        email = authUser.user.email || ''
                        fullName = authUser.user.user_metadata?.full_name || ''
                    }
                } catch (error) {
                    console.error('Error fetching auth data for user:', user.id, error)
                }

                return {
                    id: user.id,
                    created_at: user.created_at,
                    role: user.role,
                    shop_id: user.shop_id,
                    organization_id: user.organization_id,
                    plan: user.plan,
                    status: user.status,
                    shop_name: user.shops?.shop_name,
                    email,
                    full_name: fullName,
                    last_login: null,
                    phone: null
                }
            })
        )

        return NextResponse.json({
            success: true,
            users: transformedUsers
        })
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

