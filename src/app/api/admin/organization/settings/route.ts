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

        // Get organization settings
        const { data: organization, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userData.organization_id)
            .single()

        if (orgError) {
            throw orgError
        }

        return NextResponse.json({
            settings: {
                name: organization.name,
                organization_type: organization.organization_type,
                billing_email: organization.billing_email,
                subscription_plan: organization.subscription_plan,
                status: organization.status
            }
        })
    } catch (error) {
        console.error('Error fetching organization settings:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()
        
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

        // Update organization settings
        const { data: organization, error: updateError } = await supabase
            .from('organizations')
            .update({
                name: body.name,
                organization_type: body.organization_type,
                billing_email: body.billing_email,
                subscription_plan: body.subscription_plan,
                status: body.status,
                updated_at: new Date().toISOString()
            })
            .eq('id', userData.organization_id)
            .select()
            .single()

        if (updateError) {
            throw updateError
        }

        return NextResponse.json({
            success: true,
            settings: {
                name: organization.name,
                organization_type: organization.organization_type,
                billing_email: organization.billing_email,
                subscription_plan: organization.subscription_plan,
                status: organization.status
            }
        })
    } catch (error) {
        console.error('Error updating organization settings:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

