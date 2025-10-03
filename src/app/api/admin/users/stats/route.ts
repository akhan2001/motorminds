import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            console.error('Supabase admin client not configured')
            return NextResponse.json(
                { error: 'Database connection not configured' },
                { status: 500 }
            )
        }
        
        // console.log('Fetching user statistics from database...')
        
        // Try to get basic counts first
        let totalUsers = 0
        let activeUsers = 0
        let inactiveUsers = 0
        let suspendedUsers = 0
        let totalShops = 0
        let defaultPlan = 0
        let premiumPlan = 0
        let enterprisePlan = 0

        try {
            // Get total users count
            const { count: totalUsersCount, error: usersError } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
            
            if (usersError) {
                console.error('Error fetching total users:', usersError)
            } else {
                totalUsers = totalUsersCount || 0
            }

            // Get users by status
            const { count: activeUsersCount, error: activeError } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active')
            
            if (!activeError) {
                activeUsers = activeUsersCount || 0
            }

            const { count: inactiveUsersCount, error: inactiveError } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'inactive')
            
            if (!inactiveError) {
                inactiveUsers = inactiveUsersCount || 0
            }

            const { count: suspendedUsersCount, error: suspendedError } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'suspended')
            
            if (!suspendedError) {
                suspendedUsers = suspendedUsersCount || 0
            }

            // Get total shops count
            const { count: totalShopsCount, error: shopsError } = await supabaseAdmin
                .from('shops')
                .select('*', { count: 'exact', head: true })
            
            if (!shopsError) {
                totalShops = totalShopsCount || 0
            }

            // Get plan distribution
            const { count: defaultPlanCount, error: defaultError } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('plan', 'DEFAULT')
            
            if (!defaultError) {
                defaultPlan = defaultPlanCount || 0
            }

            const { count: premiumPlanCount, error: premiumError } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('plan', 'PREMIUM')
            
            if (!premiumError) {
                premiumPlan = premiumPlanCount || 0
            }

            const { count: enterprisePlanCount, error: enterpriseError } = await supabaseAdmin
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('plan', 'ENTERPRISE')
            
            if (!enterpriseError) {
                enterprisePlan = enterprisePlanCount || 0
            }

        } catch (dbError) {
            console.error('Database query error:', dbError)
            // Continue with default values
        }

        // console.log('Stats calculated:', {
        //     totalUsers, activeUsers, inactiveUsers, suspendedUsers,
        //     totalShops, defaultPlan, premiumPlan, enterprisePlan
        // })

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                inactiveUsers,
                suspendedUsers,
                totalShops,
                planDistribution: {
                    DEFAULT: defaultPlan,
                    PREMIUM: premiumPlan,
                    ENTERPRISE: enterprisePlan
                }
            }
        })
    } catch (error) {
        console.error('Error fetching user stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch user statistics' },
            { status: 500 }
        )
    }
}

