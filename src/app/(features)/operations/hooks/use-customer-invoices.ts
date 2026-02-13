'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import type { InvoiceWithDetails } from '../../financials/types/invoice'

const supabase = createClient()

export function useCustomerInvoices(
    customerId: string | null | undefined,
    shopId: string | undefined,
    organizationWide: boolean = true // Default to organization-wide for better customer experience
) {
    return useQuery({
        queryKey: ['customer-invoices', customerId, shopId, organizationWide],
        queryFn: async () => {
            if (!customerId || !shopId) return []

            // Get shop's organization info for organization-aware queries
            const { data: shopData } = await supabase
                .from('shops')
                .select('organization_id')
                .eq('id', shopId)
                .single()

            // Fetch all invoices for customer (active and archived); `archived` is in select for UI grouping
            let query = supabase
                .from('invoices_table')
                .select(`
                    id, invoice_number, display_id, shop_id, customer_id, vehicle_id, work_order_id, status, priority, 
                    title, description, subtotal, tax_rate, tax_amount, discount_amount, total_amount, 
                    labor_total, parts_total, services_total, fees_total, invoice_items,
                    issue_date, due_date, paid_date, payment_method, payment_reference, notes, created_at, updated_at, archived,
                    customer_type, walk_in_vehicle_info,
                    customer:customers(id, customer_name, customer_email, customer_phone, customer_address),
                    vehicle:customer_vehicles(id, year, make, model, license_plate, vin, color, mileage),
                    work_order:work_orders(id, work_order_number, title, status),
                    shop:shops(id, shop_name)
                `)
                .eq('customer_id', customerId)
                .order('issue_date', { ascending: false })
                .limit(50) // Increased limit for organization-wide view

            // Apply organization-aware filtering
            if (organizationWide && shopData?.organization_id) {
                // MSO shop: show invoices from all shops in the organization
                // The RLS policies will handle the access control
                // No additional shop_id filter needed - let RLS handle it
            } else {
                // Non-MSO shop or shop-only mode: filter by current shop
                query = query.eq('shop_id', shopId)
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching customer invoices:', error)
                throw error
            }

            // Transform and add organization context to results
            const invoicesWithContext = (data || []).map((invoice: any) => ({
                ...invoice,
                // Ensure numeric fields are numbers
                subtotal: Number(invoice.subtotal || 0),
                tax_rate: Number(invoice.tax_rate || 0),
                tax_amount: Number(invoice.tax_amount || 0),
                discount_amount: Number(invoice.discount_amount || 0),
                total_amount: Number(invoice.total_amount || 0),
                labor_total: Number(invoice.labor_total || 0),
                parts_total: Number(invoice.parts_total || 0),
                services_total: Number(invoice.services_total || 0),
                fees_total: Number(invoice.fees_total || 0),
                invoice_items: invoice.invoice_items || [],
                // Ensure relations are properly structured (Supabase returns them as single objects, not arrays)
                customer: invoice.customer ? {
                    id: invoice.customer.id,
                    customer_name: invoice.customer.customer_name,
                    customer_email: invoice.customer.customer_email,
                    customer_phone: invoice.customer.customer_phone,
                    customer_address: invoice.customer.customer_address
                } : null,
                vehicle: invoice.vehicle ? {
                    id: invoice.vehicle.id,
                    year: invoice.vehicle.year,
                    make: invoice.vehicle.make,
                    model: invoice.vehicle.model,
                    license_plate: invoice.vehicle.license_plate
                } : null,
                work_order: invoice.work_order ? {
                    id: invoice.work_order.id,
                    work_order_number: invoice.work_order.work_order_number,
                    title: invoice.work_order.title,
                    status: invoice.work_order.status
                } : null,
                // Add organization context
                isFromCurrentShop: invoice.shop_id === shopId,
                shopName: invoice.shop?.shop_name
            }))

            return invoicesWithContext as InvoiceWithDetails[]
        },
        enabled: !!customerId && !!shopId && customerId !== null && customerId !== '' && customerId !== 'new' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId),
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}