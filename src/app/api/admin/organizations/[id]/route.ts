import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const organizationId = params.id
        
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
            .select('role, organization_id')
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
        const isOrgAdmin = (userRole === 'ADMIN' || userRole === 'ORGANIZATION_ADMIN') && 
                          userData.organization_id === organizationId

        // Check access
        if (!isSuperAdmin && !isOrgAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Access denied to this organization' },
                { status: 403 }
            )
        }

        // Get organization with shop count
        const { data: organization, error: orgError } = await supabase
            .from('organizations')
            .select(`
                *,
                shops:shops(count)
            `)
            .eq('id', organizationId)
            .single()

        if (orgError) {
            if (orgError.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Organization not found' },
                    { status: 404 }
                )
            }
            throw orgError
        }

        return NextResponse.json({
            organization: {
                ...organization,
                shop_count: organization.shops?.[0]?.count || 0
            }
        })
    } catch (error) {
        console.error('Error fetching organization:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const organizationId = params.id
        const body = await request.json()
        
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
            .select('role, organization_id')
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
        const isOrgAdmin = (userRole === 'ADMIN' || userRole === 'ORGANIZATION_ADMIN') && 
                          userData.organization_id === organizationId

        // Check access
        if (!isSuperAdmin && !isOrgAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Access denied to this organization' },
                { status: 403 }
            )
        }

        // Update organization
        const { data: organization, error: updateError } = await supabase
            .from('organizations')
            .update({
                ...body,
                updated_at: new Date().toISOString()
            })
            .eq('id', organizationId)
            .select()
            .single()

        if (updateError) {
            throw updateError
        }

        return NextResponse.json({
            organization,
            message: 'Organization updated successfully'
        })
    } catch (error) {
        console.error('Error updating organization:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const organizationId = params.id
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Only super admins can delete organizations
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
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

        // Delete organization (cascade will handle related records)
        const { error: deleteError } = await supabase
            .from('organizations')
            .delete()
            .eq('id', organizationId)

        if (deleteError) {
            throw deleteError
        }

        return NextResponse.json({
            message: 'Organization deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting organization:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

