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

        // Get all shops for this organization
        const { data: shops, error: shopsError } = await supabase
            .from('shops')
            .select('*')
            .eq('organization_id', userData.organization_id)
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

