import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserAccessContextFromRequest } from '@/lib/auth/access-context'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        
        // Get user access context (scope-aware: shop, organization, or platform)
        const context = await getUserAccessContextFromRequest()
        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Await params before accessing properties
        const { id: customerId } = await params

        // Verify customer is accessible to the user (organization-aware)
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('id, shop_id, organization_id')
            .eq('id', customerId)
            .maybeSingle()

        if (customerError || !customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Check access based on scope
        let hasAccess = false
        if (context.accessScope === 'platform') {
            hasAccess = true // Platform admins can see all customers
        } else if (context.accessScope === 'organization' && context.organizationId) {
            // Organization users can see customers from same org or accessible shops
            hasAccess = customer.organization_id === context.organizationId || 
                       (context.shopId && customer.shop_id === context.shopId) ||
                       context.accessibleShopIds.includes(customer.shop_id)
        } else {
            // Shop users can only see customers from their shop
            hasAccess = (context.shopId && customer.shop_id === context.shopId) || 
                       context.accessibleShopIds.includes(customer.shop_id)
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Determine which client to use based on access scope
        // Platform/org admins may need admin client for cross-shop queries
        const useAdminClient = context.accessScope === 'platform' || 
                              (context.accessScope === 'organization' && context.organizationId)
        const queryClient = useAdminClient && supabaseAdmin ? supabaseAdmin : supabase

        // Build shop filter based on access scope
        let shopFilter: string[] | null = null
        if (context.accessScope === 'shop' && context.shopId) {
            shopFilter = [context.shopId]
        } else if (context.accessScope === 'organization' && context.organizationId) {
            shopFilter = context.accessibleShopIds.length > 0 ? context.accessibleShopIds : null
        }
        // Platform scope: no filter (can see all shops)


        // Fetch work orders for the customer
        let workOrdersQuery = queryClient
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
        
        // Apply shop filter if needed
        if (shopFilter && shopFilter.length > 0) {
            workOrdersQuery = workOrdersQuery.in('shop_id', shopFilter)
        }
        
        const { data: workOrders, error: workOrdersError } = await workOrdersQuery
            .order('created_at', { ascending: false })
            .limit(100)

        if (workOrdersError) {
            console.error('Error fetching work orders:', workOrdersError)
        }

        // Fetch appointments for the customer
        let appointmentsQuery = queryClient
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
        
        // Apply shop filter if needed
        if (shopFilter && shopFilter.length > 0) {
            appointmentsQuery = appointmentsQuery.in('shop_id', shopFilter)
        }
        
        const { data: appointments, error: appointmentsError } = await appointmentsQuery
            .order('appointment_date', { ascending: false })
            .limit(100)

        if (appointmentsError) {
            console.error('Error fetching appointments:', appointmentsError)
        }

        // Fetch invoices for the customer
        let invoicesQuery = queryClient
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
        
        // Apply shop filter if needed
        if (shopFilter && shopFilter.length > 0) {
            invoicesQuery = invoicesQuery.in('shop_id', shopFilter)
        }
        
        const { data: invoices, error: invoicesError } = await invoicesQuery
            .order('issue_date', { ascending: false })
            .limit(100)

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
