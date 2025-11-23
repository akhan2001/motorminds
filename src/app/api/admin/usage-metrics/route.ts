import { NextRequest, NextResponse } from 'next/server'
import { UsageMetricsService } from '@/app/(features)/admin/lib/usage-metrics-service'
import { getShopIdForUser } from '@/utils/get-shop-id'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    try {
        // Check if user is super admin
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user role from database
        const { data: userData, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (roleError || !userData) {
            return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
        }

        const userRole = userData.role?.toUpperCase()
        if (userRole !== 'SUPER-ADMIN') {
            return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const shopIds = searchParams.get('shopIds')?.split(',').filter(Boolean)

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Missing required parameters: startDate, endDate' },
                { status: 400 }
            )
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD' },
                { status: 400 }
            )
        }

        const metrics = await UsageMetricsService.getUsageMetrics({
            startDate,
            endDate,
            shopIds
        })

        return NextResponse.json({ metrics })
    } catch (error) {
        console.error('Error fetching usage metrics:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check if user is super admin
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user role from database
        const { data: userData, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (roleError || !userData) {
            return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
        }

        const userRole = userData.role?.toUpperCase()
        if (userRole !== 'SUPER-ADMIN') {
            return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { startDate, endDate, shopIds, format = 'json' } = body

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Missing required parameters: startDate, endDate' },
                { status: 400 }
            )
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD' },
                { status: 400 }
            )
        }

        const metrics = await UsageMetricsService.getUsageMetrics({
            startDate,
            endDate,
            shopIds
        })

        if (format === 'text') {
            const textReport = UsageMetricsService.generateTextReport(metrics)
            
            return new NextResponse(textReport, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Content-Disposition': `attachment; filename="usage-metrics-${startDate}-to-${endDate}.txt"`
                }
            })
        }

        return NextResponse.json({ metrics })
    } catch (error) {
        console.error('Error generating usage metrics report:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
