import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isUserAdmin } from '@/lib/auth/admin-role-checker'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!supabaseAdmin) {
            console.error('Supabase admin client not configured')
            return NextResponse.json(
                { error: 'Database connection not configured' },
                { status: 500 }
            )
        }

        const supabase = await createClient()
        
        // Get the authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is admin
        const adminCheck = await isUserAdmin(user.id)
        if (!adminCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Await params before accessing properties
        const { id: customerId } = await params


        // Fetch work orders for the customer using admin client (bypasses RLS)
        const { data: workOrders, error: workOrdersError } = await supabaseAdmin
            .from('work_orders')
            .select(`
                id,
                work_order_number,
                title,
                status,
                priority,
                created_at,
                updated_at,
                completed_at,
                customer_vehicles(
                    id,
                    year,
                    make,
                    model,
                    license_plate
                ),
                employees(
                    id,
                    first_name,
                    last_name
                ),
                shops(
                    id,
                    shop_name
                )
            `)
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(20)

        if (workOrdersError) {
            console.error('Error fetching work orders:', workOrdersError)
        }

        // Fetch appointments for the customer using admin client (bypasses RLS)
        const { data: appointments, error: appointmentsError } = await supabaseAdmin
            .from('appointments')
            .select(`
                id,
                appointment_date,
                start_time,
                end_time,
                service_type,
                status,
                notes,
                created_at,
                confirmation_code,
                customer_vehicles(
                    id,
                    year,
                    make,
                    model,
                    license_plate
                ),
                shops(
                    id,
                    shop_name
                )
            `)
            .eq('customer_id', customerId)
            .order('appointment_date', { ascending: false })
            .limit(20)

        if (appointmentsError) {
            console.error('Error fetching appointments:', appointmentsError)
        }

        // Fetch invoices for the customer
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices_table')
            .select(`
                id,
                invoice_number,
                status,
                total_amount,
                issue_date,
                due_date,
                paid_date,
                created_at,
                work_order:work_orders(
                    id,
                    work_order_number,
                    title
                ),
                shops(
                    id,
                    shop_name
                )
            `)
            .eq('customer_id', customerId)
            .order('issue_date', { ascending: false })
            .limit(20)

        if (invoicesError) {
            console.error('Error fetching invoices:', invoicesError)
        }

        // Calculate summary statistics
        const totalSpent = invoices?.reduce((sum, invoice) => {
            return sum + (invoice.total_amount || 0)
        }, 0) || 0

        const lastVisit = workOrders?.[0]?.created_at || appointments?.[0]?.appointment_date

        const customerHistory = {
            workOrders: workOrders || [],
            appointments: appointments || [],
            invoices: invoices || [],
            totalSpent,
            lastVisit,
            stats: {
                totalWorkOrders: workOrders?.length || 0,
                totalAppointments: appointments?.length || 0,
                totalInvoices: invoices?.length || 0,
                completedWorkOrders: workOrders?.filter(wo => wo.status === 'completed').length || 0,
                paidInvoices: invoices?.filter(inv => inv.status === 'paid').length || 0
            },
            errors: {
                workOrders: workOrdersError?.message || null,
                appointments: appointmentsError?.message || null,
                invoices: invoicesError?.message || null
            }
        }


        return NextResponse.json(customerHistory)

    } catch (error) {
        console.error('Error fetching customer history:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
