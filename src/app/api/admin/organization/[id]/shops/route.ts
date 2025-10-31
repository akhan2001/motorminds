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

        // Verify user has access to this organization
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

        const isAdmin = userData.role?.toUpperCase() === 'ADMIN'
        const isSuperAdmin = isAdmin && !userData.organization_id
        const isOrgAdmin = isAdmin && userData.organization_id === organizationId

        if (!isSuperAdmin && !isOrgAdmin) {
            return NextResponse.json(
                { error: 'Forbidden - Access denied to this organization' },
                { status: 403 }
            )
        }

        // Get all shops for this organization
        const { data: shops, error: shopsError } = await supabase
            .from('shops')
            .select('*')
            .eq('organization_id', organizationId)
            .order('shop_name', { ascending: true })

        if (shopsError) {
            throw shopsError
        }

        return NextResponse.json({
            shops: shops || []
        })
    } catch (error) {
        console.error('Error fetching organization shops:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

