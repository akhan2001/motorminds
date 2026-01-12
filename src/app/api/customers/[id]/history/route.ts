import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShopIdForUser } from '@/utils/get-shop-id'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const shopId = await getShopIdForUser()
        
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Await params before accessing properties
        const { id: customerId } = await params

        // Check if customer exists and is accessible (organization-aware)
        const { data: shopData } = await supabase
            .from('shops')
            .select('organization_id')
            .eq('id', shopId)
            .single()

        let customerQuery = supabase
            .from('customers')
            .select('id, shop_id, organization_id')
            .eq('id', customerId)

        // Apply organization-aware filter
        if (shopData?.organization_id) {
            // MSO shop: allow customers from same organization or same shop
            customerQuery = customerQuery.or(`organization_id.eq.${shopData.organization_id},shop_id.eq.${shopId}`)
        } else {
            // Non-MSO shop: only same shop
            customerQuery = customerQuery.eq('shop_id', shopId)
        }

        const { data: customer, error: customerError } = await customerQuery.maybeSingle()

        if (customerError || !customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Fetch work orders for the customer
        const { data: workOrders, error: workOrdersError } = await supabase
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

        // Fetch appointments for the customer
        const { data: appointments, error: appointmentsError } = await supabase
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

