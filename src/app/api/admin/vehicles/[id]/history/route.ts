import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserAccessContextFromRequest } from '@/lib/auth/access-context'
import { resolveShopFilter } from '@/lib/services/query-utils'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()

        const context = await getUserAccessContextFromRequest()
        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: vehicleId } = await params

        // Verify vehicle exists and get customer's shop for access check
        const { data: vehicle, error: vehicleError } = await supabase
            .from('customer_vehicles')
            .select('id, customer_id, customers(shop_id, organization_id)')
            .eq('id', vehicleId)
            .maybeSingle()

        if (vehicleError || !vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
        }

        const customer = (vehicle as any).customers
        if (!customer) {
            return NextResponse.json({ error: 'Vehicle has no customer' }, { status: 404 })
        }

        const shopId = customer.shop_id
        const organizationId = customer.organization_id

        // Check access (same matrix as customer history)
        let hasAccess = false
        if (context.accessScope === 'platform') {
            hasAccess = true
        } else if (context.accessScope === 'organization' && context.organizationId) {
            hasAccess =
                organizationId === context.organizationId ||
                (context.shopId && shopId === context.shopId) ||
                context.accessibleShopIds.includes(shopId)
        } else {
            hasAccess =
                (context.shopId && shopId === context.shopId) ||
                context.accessibleShopIds.includes(shopId)
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const useAdminClient =
            context.accessScope === 'platform' ||
            (context.accessScope === 'organization' && context.organizationId)
        const queryClient =
            useAdminClient && supabaseAdmin ? supabaseAdmin : supabase

        const { shopIds } = resolveShopFilter(context)
        const shopFilter =
            shopIds && shopIds.length > 0 ? shopIds : null

        // Fetch work orders for this vehicle (same select shape as customer history)
        let workOrdersQuery = queryClient
            .from('work_orders')
            .select(
                `
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
            `
            )
            .eq('vehicle_id', vehicleId)

        if (shopFilter && shopFilter.length > 0) {
            workOrdersQuery = workOrdersQuery.in('shop_id', shopFilter)
        }

        const { data: workOrders, error: workOrdersError } =
            await workOrdersQuery
                .order('created_at', { ascending: false })
                .limit(100)

        if (workOrdersError) {
            console.error('Error fetching work orders:', workOrdersError)
        }

        // Fetch appointments for this vehicle
        let appointmentsQuery = queryClient
            .from('appointments')
            .select(
                `
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
            `
            )
            .eq('vehicle_id', vehicleId)

        if (shopFilter && shopFilter.length > 0) {
            appointmentsQuery = appointmentsQuery.in('shop_id', shopFilter)
        }

        const { data: appointments, error: appointmentsError } =
            await appointmentsQuery
                .order('appointment_date', { ascending: false })
                .limit(100)

        if (appointmentsError) {
            console.error('Error fetching appointments:', appointmentsError)
        }

        // Fetch invoices for this vehicle
        let invoicesQuery = queryClient
            .from('invoices_table')
            .select(
                `
                id,
                invoice_number,
                status,
                total_amount,
                issue_date,
                due_date,
                paid_date,
                created_at,
                customer_type,
                walk_in_vehicle_info,
                vehicle:customer_vehicles(
                    id,
                    year,
                    make,
                    model,
                    license_plate
                ),
                work_order:work_orders(
                    id,
                    work_order_number,
                    title
                ),
                shops(
                    id,
                    shop_name
                )
            `
            )
            .eq('vehicle_id', vehicleId)

        if (shopFilter && shopFilter.length > 0) {
            invoicesQuery = invoicesQuery.in('shop_id', shopFilter)
        }

        const { data: invoices, error: invoicesError } =
            await invoicesQuery
                .order('issue_date', { ascending: false })
                .limit(100)

        if (invoicesError) {
            console.error('Error fetching invoices:', invoicesError)
        }

        const totalSpent =
            invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) ||
            0

        const lastVisit =
            workOrders?.[0]?.created_at ||
            appointments?.[0]?.appointment_date

        const vehicleHistory = {
            workOrders: workOrders || [],
            appointments: appointments || [],
            invoices: invoices || [],
            totalSpent,
            lastVisit,
            stats: {
                totalWorkOrders: workOrders?.length || 0,
                totalAppointments: appointments?.length || 0,
                totalInvoices: invoices?.length || 0,
                completedWorkOrders:
                    workOrders?.filter((wo) => wo.status === 'completed')
                        .length || 0,
                paidInvoices:
                    invoices?.filter((inv) => inv.status === 'paid').length || 0
            },
            errors: {
                workOrders: workOrdersError?.message || null,
                appointments: appointmentsError?.message || null,
                invoices: invoicesError?.message || null
            }
        }

        return NextResponse.json(vehicleHistory)
    } catch (error) {
        console.error('Error fetching vehicle history:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
