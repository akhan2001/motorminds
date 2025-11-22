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

        // Verify user is super admin
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userError || !userData || userData.role?.toUpperCase() !== 'SUPER-ADMIN' && userData.role?.toUpperCase() !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden - Super admin access required' },
                { status: 403 }
            )
        }

        // Get all stats in parallel
        const [orgsResult, shopsResult, usersResult] = await Promise.all([
            supabase.from('organizations').select('id', { count: 'exact', head: true }),
            supabase.from('shops').select('id', { count: 'exact', head: true }),
            supabase.from('users').select('id', { count: 'exact', head: true })
        ])

        // Get revenue from invoices (if invoices table exists)
        let revenue = 0
        try {
            const { data: invoices } = await supabase
                .from('invoices')
                .select('total_amount')
            
            if (invoices) {
                revenue = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0)
            }
        } catch (error) {
            // Invoices table might not exist or have different structure
            console.warn('Could not fetch revenue:', error)
        }

        return NextResponse.json({
            stats: {
                totalOrganizations: orgsResult.count || 0,
                totalShops: shopsResult.count || 0,
                totalUsers: usersResult.count || 0,
                platformRevenue: revenue
            }
        })
    } catch (error) {
        console.error('Error fetching super admin stats:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

