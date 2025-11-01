'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import type { InvoiceWithDetails } from '../../financials/types/invoice'

const supabase = createClient()

export function useCustomerInvoices(customerId: string | null | undefined, shopId: string | undefined) {
    return useQuery({
        queryKey: ['customer-invoices', customerId, shopId],
        queryFn: async () => {
            if (!customerId || !shopId) return []

            const { data, error } = await supabase
                .from('invoices_table')
                .select(`
                    *,
                    customer:customers(id, customer_name, customer_email),
                    vehicle:customer_vehicles(id, year, make, model, license_plate),
                    work_order:work_orders(id, work_order_number, title, status)
                `)
                .eq('customer_id', customerId)
                .eq('shop_id', shopId)
                .eq('archived', true) // Only show archived (historical) invoices
                .order('issue_date', { ascending: false })
                .limit(20) // Reduced from 50 for better performance

            if (error) {
                console.error('Error fetching customer invoices:', error)
                throw error
            }

            return (data || []) as InvoiceWithDetails[]
        },
        enabled: !!customerId && !!shopId && customerId !== null,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}