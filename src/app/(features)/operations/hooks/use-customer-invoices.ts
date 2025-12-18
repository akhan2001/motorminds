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

            let query = supabase
                .from('invoices_table')
                .select(`
                    id, invoice_number, shop_id, customer_id, vehicle_id, work_order_id, status, total_amount, issue_date, due_date, paid_date, created_at, archived,
                    customer:customers(id, customer_name, customer_email),
                    vehicle:customer_vehicles(id, year, make, model, license_plate),
                    work_order:work_orders(id, work_order_number, title, status),
                    shop:shops(id, shop_name)
                `)
                .eq('customer_id', customerId)
                .eq('archived', true) // Only show archived (historical) invoices
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

            // Add organization context to results
            const invoicesWithContext = (data || []).map(invoice => ({
                ...invoice,
                isFromCurrentShop: invoice.shop_id === shopId,
                shopName: (invoice as any).shop?.shop_name
            }))

            return invoicesWithContext as InvoiceWithDetails[]
        },
        enabled: !!customerId && !!shopId && customerId !== null,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}