import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

export interface WorkOrderInvoice {
    id: string
    invoice_number: string
    display_id: string | null
    status: string
    total_amount: number
    created_at: string
}

export function useWorkOrderInvoice(workOrderId: string) {
    return useQuery({
        queryKey: ['work-order-invoice', workOrderId],
        queryFn: async (): Promise<WorkOrderInvoice | null> => {
            if (!workOrderId) return null

            const { data, error } = await supabase
                .from('invoices_table')
                .select('id, invoice_number, display_id, status, total_amount, created_at')
                .eq('work_order_id', workOrderId)
                .limit(1)
                .single()

            if (error) {
                // If no invoice found, return null (not an error)
                if (error.code === 'PGRST116') {
                    return null
                }
                throw error
            }

            return data
        },
        enabled: !!workOrderId
    })
}
