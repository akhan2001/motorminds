import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET - List all employees for a shop
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get shop_id from query params
        const { searchParams } = new URL(req.url)
        const shopId = searchParams.get('shop_id')
        const activeOnly = searchParams.get('active_only') === 'true'

        if (!shopId) {
            return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 })
        }

        // Verify user has access to this shop
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (userData.shop_id !== shopId) {
            return NextResponse.json({ error: 'Forbidden - Access denied to this shop' }, { status: 403 })
        }

        // Build query
        let query = supabase
            .from('employees')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })

        // Filter by termination_date if activeOnly
        if (activeOnly) {
            query = query.is('termination_date', null)
        }

        const { data: employees, error } = await query

        if (error) {
            console.error('Error fetching employees:', error)
            return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
        }

        return NextResponse.json({ employees: employees || [] })
    } catch (error) {
        console.error('Employees GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create a new employee
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { shop_id, first_name, last_name, role, salary_or_wage, pay_frequency } = body

        // Validation
        if (!shop_id || !first_name || !role || salary_or_wage === undefined || !pay_frequency) {
            return NextResponse.json(
                { error: 'Missing required fields: shop_id, first_name, role, salary_or_wage, pay_frequency' },
                { status: 400 }
            )
        }

        // Verify user has access to this shop
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('shop_id')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (userData.shop_id !== shop_id) {
            return NextResponse.json({ error: 'Forbidden - Access denied to this shop' }, { status: 403 })
        }

        // Validate pay_frequency
        const validFrequencies = ['hourly', 'weekly', 'bi-weekly', 'monthly']
        if (!validFrequencies.includes(pay_frequency)) {
            return NextResponse.json(
                { error: `Invalid pay_frequency. Must be one of: ${validFrequencies.join(', ')}` },
                { status: 400 }
            )
        }

        // Insert employee
        const { data: employee, error: insertError } = await supabase
            .from('employees')
            .insert({
                shop_id,
                first_name,
                last_name: last_name || null,
                role,
                salary_or_wage: parseFloat(salary_or_wage),
                pay_frequency,
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error creating employee:', insertError)
            return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
        }

        return NextResponse.json({ employee }, { status: 201 })
    } catch (error) {
        console.error('Employees POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

