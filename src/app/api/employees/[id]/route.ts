import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// PATCH - Update an employee
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params
        const body = await req.json()

        // Get employee to verify shop access
        const { data: employee, error: employeeError } = await supabase
            .from('employees')
            .select('shop_id')
            .eq('id', id)
            .single()

        if (employeeError || !employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
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

        if (userData.shop_id !== employee.shop_id) {
            return NextResponse.json({ error: 'Forbidden - Access denied to this shop' }, { status: 403 })
        }

        // Validate pay_frequency if provided
        if (body.pay_frequency) {
            const validFrequencies = ['hourly', 'weekly', 'bi-weekly', 'monthly']
            if (!validFrequencies.includes(body.pay_frequency)) {
                return NextResponse.json(
                    { error: `Invalid pay_frequency. Must be one of: ${validFrequencies.join(', ')}` },
                    { status: 400 }
                )
            }
        }

        // Build update object (only include provided fields)
        const updateData: any = {}
        if (body.first_name !== undefined) updateData.first_name = body.first_name
        if (body.last_name !== undefined) updateData.last_name = body.last_name || null
        if (body.role !== undefined) updateData.role = body.role
        if (body.salary_or_wage !== undefined) updateData.salary_or_wage = parseFloat(body.salary_or_wage)
        if (body.pay_frequency !== undefined) updateData.pay_frequency = body.pay_frequency
        if (body.termination_date !== undefined) updateData.termination_date = body.termination_date || null

        // Update employee
        const { data: updatedEmployee, error: updateError } = await supabase
            .from('employees')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating employee:', updateError)
            return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
        }

        return NextResponse.json({ employee: updatedEmployee })
    } catch (error) {
        console.error('Employee PATCH error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Soft delete an employee (set termination_date)
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params

        // Get employee to verify shop access
        const { data: employee, error: employeeError } = await supabase
            .from('employees')
            .select('shop_id')
            .eq('id', id)
            .single()

        if (employeeError || !employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
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

        if (userData.shop_id !== employee.shop_id) {
            return NextResponse.json({ error: 'Forbidden - Access denied to this shop' }, { status: 403 })
        }

        // Soft delete by setting termination_date
        const { error: updateError } = await supabase
            .from('employees')
            .update({ termination_date: new Date().toISOString().split('T')[0] })
            .eq('id', id)

        if (updateError) {
            console.error('Error deleting employee:', updateError)
            return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Employee DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

