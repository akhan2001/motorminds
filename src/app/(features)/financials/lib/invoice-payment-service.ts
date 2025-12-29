import { createClient } from '@/utils/supabase/client'
import type { Payment } from '../types/invoice'

const supabase = createClient()

export class InvoicePaymentService {
    /**
     * Add a payment to an invoice
     * Validates that payment doesn't exceed outstanding balance
     */
    static async addPayment(
        invoiceNumber: string,
        payment: Omit<Payment, 'id' | 'created_at'>
    ): Promise<void> {
        // Fetch current invoice
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices_table')
            .select('payments, total_amount, amount_paid, outstanding_balance')
            .eq('invoice_number', invoiceNumber)
            .single()

        if (fetchError || !invoice) {
            throw new Error(`Invoice not found: ${invoiceNumber}`)
        }

        // Validate payment amount
        const currentPayments = (invoice.payments as Payment[]) || []
        const currentAmountPaid = invoice.amount_paid || 0
        const outstandingBalance = invoice.outstanding_balance || invoice.total_amount
        const newTotal = currentAmountPaid + payment.amount

        if (payment.amount <= 0) {
            throw new Error('Payment amount must be greater than zero')
        }

        if (newTotal > invoice.total_amount) {
            throw new Error(`Payment amount exceeds outstanding balance of ${outstandingBalance.toFixed(2)}`)
        }

        // Add new payment to array
        const newPayment: Payment = {
            id: crypto.randomUUID(),
            ...payment,
            created_at: new Date().toISOString()
        }

        const updatedPayments = [...currentPayments, newPayment]

        // Update invoice with new payments array
        // The database trigger will automatically calculate amount_paid, outstanding_balance, and update status
        const { error: updateError } = await supabase
            .from('invoices_table')
            .update({ payments: updatedPayments })
            .eq('invoice_number', invoiceNumber)

        if (updateError) {
            console.error('Error adding payment:', updateError)
            throw new Error(`Failed to add payment: ${updateError.message}`)
        }
    }

    /**
     * Remove a payment from an invoice
     */
    static async removePayment(
        invoiceNumber: string,
        paymentId: string
    ): Promise<void> {
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices_table')
            .select('payments')
            .eq('invoice_number', invoiceNumber)
            .single()

        if (fetchError || !invoice) {
            throw new Error(`Invoice not found: ${invoiceNumber}`)
        }

        const currentPayments = (invoice.payments as Payment[]) || []
        const updatedPayments = currentPayments.filter(p => p.id !== paymentId)

        // Update invoice - trigger will recalculate totals
        const { error: updateError } = await supabase
            .from('invoices_table')
            .update({ payments: updatedPayments })
            .eq('invoice_number', invoiceNumber)

        if (updateError) {
            console.error('Error removing payment:', updateError)
            throw new Error(`Failed to remove payment: ${updateError.message}`)
        }
    }
}

