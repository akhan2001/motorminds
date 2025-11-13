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

        // Super admin can see all organizations
        if (isSuperAdmin) {
            const { data: organizations, error: orgsError } = await supabase
                .from('organizations')
                .select(`
                    *,
                    shops:shops(count)
                `)
                .order('created_at', { ascending: false })

            if (orgsError) {
                throw orgsError
            }

            const formattedOrganizations = organizations?.map(org => ({
                ...org,
                shop_count: org.shops?.[0]?.count || 0
            }))

            return NextResponse.json({
                organizations: formattedOrganizations || []
            })
        }

        // Organization admin can only see their own organization
        if (isOrgAdmin && userData.organization_id) {
            const { data: organization, error: orgError } = await supabase
                .from('organizations')
                .select(`
                    *,
                    shops:shops(count)
                `)
                .eq('id', userData.organization_id)
                .single()

            if (orgError) {
                throw orgError
            }

            return NextResponse.json({
                organizations: [{
                    ...organization,
                    shop_count: organization.shops?.[0]?.count || 0
                }]
            })
        }

        return NextResponse.json(
            { error: 'Forbidden - Admin access required' },
            { status: 403 }
        )
    } catch (error) {
        console.error('Error fetching organizations:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
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

        // Verify user is super admin (only super admins can create organizations)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, organization_id')
            .eq('id', user.id)
            .single()

        const userRole = userData?.role?.toUpperCase()
        const isSuperAdmin = userRole === 'SUPER-ADMIN' || userRole === 'SUPER_ADMIN'
        
        if (userError || !userData || !isSuperAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Super admin access required' },
                { status: 403 }
            )
        }

        // Get request body
        const body = await request.json()
        const { name, organization_type, billing_email, subscription_plan, status } = body

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { error: 'Organization name is required' },
                { status: 400 }
            )
        }

        // Create organization
        const { data: organization, error: createError } = await supabase
            .from('organizations')
            .insert({
                name,
                organization_type: organization_type || 'mso',
                billing_email,
                subscription_plan,
                status: status || 'active'
            })
            .select()
            .single()

        if (createError) {
            throw createError
        }

        return NextResponse.json({
            organization,
            message: 'Organization created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating organization:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

