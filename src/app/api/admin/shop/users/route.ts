import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

        // Get all users in shop
        const { data: shopUsers } = await supabase
            .from('users')
            .select('id, role, shop_id, organization_id, plan, status, created_at')
            .eq('shop_id', userData.shop_id)

        // Get user emails and metadata from auth.users
        const userIds = shopUsers?.map((u: any) => u.id) || []
        let authUsersMap = new Map<string, { email: string; full_name: string }>()
        
        if (userIds.length > 0 && supabaseAdmin) {
            try {
                const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
                
                authUsersMap = new Map(
                    (authUsers?.users || [])
                        .filter((authUser: any) => userIds.includes(authUser.id))
                        .map((authUser: any) => [
                            authUser.id,
                            {
                                email: authUser.email || '',
                                full_name: authUser.user_metadata?.full_name || ''
                            }
                        ])
                )
            } catch (error) {
                console.warn('Could not fetch auth users:', error)
            }
        }

        // Format users with email and full_name
        const formattedUsers = (shopUsers || []).map((user: any) => {
            const authData = authUsersMap.get(user.id) || { email: '', full_name: '' }
            return {
                id: user.id,
                role: user.role,
                shop_id: user.shop_id,
                organization_id: user.organization_id,
                plan: user.plan,
                status: user.status,
                created_at: user.created_at,
                email: authData.email,
                full_name: authData.full_name
            }
        })

        return NextResponse.json({
            users: formattedUsers,
            total: formattedUsers.length
        })
    } catch (error) {
        console.error('Error fetching shop users:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

