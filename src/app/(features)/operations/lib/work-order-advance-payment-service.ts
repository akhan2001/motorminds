import { createClient } from '@/utils/supabase/client'
import type { Payment } from '../../financials/types/invoice'
import { calculateInvoiceTotals } from '../../financials/lib/invoice-calculations'

const supabase = createClient()

export class WorkOrderAdvancePaymentService {
    /**
     * Add an advance payment to a work order
     * Advance payments are stored in the advance_payments JSONB array
     */
    static async addAdvancePayment(
        workOrderId: string,
        payment: Omit<Payment, 'id' | 'created_at'>
    ): Promise<void> {
        // Fetch current work order
        const { data: workOrder, error: fetchError } = await supabase
            .from('work_orders')
            .select('advance_payments')
            .eq('id', workOrderId)
            .single()

        if (fetchError || !workOrder) {
            throw new Error(`Work order not found: ${workOrderId}`)
        }

        // Get current advance payments
        const currentPayments = (workOrder.advance_payments as Payment[]) || []
        const activePayments = currentPayments.filter(p => !p.deleted)
        const totalAdvancePaid = activePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        
        // Validate payment amount
        if (payment.amount <= 0) {
            throw new Error('Payment amount must be greater than zero')
        }

        // Fetch work order items to calculate estimated total
        const { data: items, error: itemsError } = await supabase
            .from('work_order_items')
            .select('*')
            .eq('work_order_id', workOrderId)

        if (!itemsError && items && items.length > 0) {
            // Calculate estimated total from billable items
            const billableItems = items.filter(item => item.is_billable !== false)
            const calculations = calculateInvoiceTotals(billableItems as any)
            const taxRate = 0.13
            const estimatedTotal = calculations.subtotal + (calculations.subtotal * taxRate)
            
            // Calculate remaining balance
            const remainingBalance = estimatedTotal - totalAdvancePaid
            
            // Validate that payment doesn't exceed remaining balance
            // Use tolerance for floating-point comparison (allow up to 0.01 cents over for rounding)
            if (estimatedTotal > 0 && payment.amount > remainingBalance + 0.01) {
                throw new Error(`Payment amount exceeds remaining balance of ${remainingBalance.toFixed(2)}`)
            }
        }

        // Add new payment to array
        const newPayment: Payment = {
            id: crypto.randomUUID(),
            ...payment,
            created_at: new Date().toISOString(),
            deleted: false
        }

        const updatedPayments = [...currentPayments, newPayment]

        // Update work order with new advance payments
        const { error: updateError } = await supabase
            .from('work_orders')
            .update({
                advance_payments: updatedPayments,
                updated_at: new Date().toISOString()
            })
            .eq('id', workOrderId)

        if (updateError) {
            console.error('Error adding advance payment:', updateError)
            throw new Error(`Failed to add advance payment: ${updateError.message}`)
        }
    }

    /**
     * Remove (archive) an advance payment from a work order
     * Payment is marked as deleted but kept for audit/reporting purposes
     */
    static async removeAdvancePayment(
        workOrderId: string,
        paymentId: string,
        deletionReason?: string
    ): Promise<void> {
        const { data: workOrder, error: fetchError } = await supabase
            .from('work_orders')
            .select('advance_payments')
            .eq('id', workOrderId)
            .single()

        if (fetchError || !workOrder) {
            throw new Error(`Work order not found: ${workOrderId}`)
        }

        const currentPayments = (workOrder.advance_payments as Payment[]) || []
        
        // Mark payment as deleted instead of removing it (archive for reporting)
        const updatedPayments = currentPayments.map(p => {
            if (p.id === paymentId) {
                return {
                    ...p,
                    deleted: true,
                    deleted_at: new Date().toISOString(),
                    deletion_reason: deletionReason || null
                }
            }
            return p
        })

        const { error: updateError } = await supabase
            .from('work_orders')
            .update({
                advance_payments: updatedPayments,
                updated_at: new Date().toISOString()
            })
            .eq('id', workOrderId)

        if (updateError) {
            console.error('Error archiving advance payment:', updateError)
            throw new Error(`Failed to archive advance payment: ${updateError.message}`)
        }
    }
}
