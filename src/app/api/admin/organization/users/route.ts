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

        const organizationId = userData.organization_id

        // Get all users in organization
        // Users can be directly linked to organization OR linked through shops in the organization
        const { data: orgShops } = await supabase
            .from('shops')
            .select('id')
            .eq('organization_id', organizationId)

        const shopIds = orgShops?.map(shop => shop.id) || []

        // Get users directly linked to organization
        const { data: directUsers } = await supabase
            .from('users')
            .select('id, role, shop_id, organization_id, plan, status, created_at')
            .eq('organization_id', organizationId)

        // Get users linked through shops in organization
        const { data: shopUsers } = shopIds.length > 0 ? await supabase
            .from('users')
            .select('id, role, shop_id, organization_id, plan, status, created_at')
            .in('shop_id', shopIds)
            .is('organization_id', null) : { data: [] }

        // Combine and deduplicate users
        const allUsers = [...(directUsers || []), ...(shopUsers || [])]
        const uniqueUsers = Array.from(
            new Map(allUsers.map(user => [user.id, user])).values()
        )

        // Get user emails and metadata from auth.users
        const userIds = uniqueUsers.map((u: any) => u.id)
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
        const formattedUsers = uniqueUsers.map((user: any) => {
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
        console.error('Error fetching organization users:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

