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

        // Get active payments (not deleted)
        const currentPayments = (invoice.payments as Payment[]) || []
        const activePayments = currentPayments.filter(p => !p.deleted)
        const currentAmountPaid = activePayments.reduce((sum, p) => sum + p.amount, 0)
        const outstandingBalance = invoice.total_amount - currentAmountPaid
        const newTotal = currentAmountPaid + payment.amount

        // Allow $0 payments for $0 invoices
        if (invoice.total_amount > 0 && payment.amount <= 0) {
            throw new Error('Payment amount must be greater than zero')
        }

        // Use tolerance for floating-point comparison (allow up to 0.01 cents over for rounding)
        const exceedsTotal = (newTotal - invoice.total_amount) > 0.01
        if (exceedsTotal) {
            throw new Error(`Payment amount exceeds outstanding balance of ${outstandingBalance.toFixed(2)}`)
        }

        // Add new payment to array
        const newPayment: Payment = {
            id: crypto.randomUUID(),
            ...payment,
            created_at: new Date().toISOString(),
            deleted: false
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
     * Remove (archive) a payment from an invoice
     * Payment is marked as deleted but kept for audit/reporting purposes
     */
    static async removePayment(
        invoiceNumber: string,
        paymentId: string,
        deletionReason?: string
    ): Promise<void> {
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices_table')
            .select('payments, total_amount, status')
            .eq('invoice_number', invoiceNumber)
            .single()

        if (fetchError || !invoice) {
            throw new Error(`Invoice not found: ${invoiceNumber}`)
        }

        const currentPayments = (invoice.payments as Payment[]) || []
        
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

        // Calculate new amount_paid from non-deleted payments only
        const activePayments = updatedPayments.filter(p => !p.deleted)
        const newAmountPaid = activePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        const totalAmount = Number(invoice.total_amount) || 0
        const newOutstandingBalance = Math.max(0, totalAmount - newAmountPaid)

        // Determine new status based on payment amounts
        // Preserve cancelled/refunded status, otherwise update based on payments
        let newStatus = invoice.status
        if (invoice.status !== 'cancelled' && invoice.status !== 'refunded') {
            if (newAmountPaid === 0) {
                newStatus = 'unpaid'
            } else if (newAmountPaid >= totalAmount) {
                newStatus = 'paid'
            } else {
                newStatus = 'partially_paid'
            }
        }

        // Update invoice with payments array and recalculated amounts
        // Explicitly set these fields to override any database trigger calculations
        const updateData: any = { 
            payments: updatedPayments,
            amount_paid: newAmountPaid,
            outstanding_balance: newOutstandingBalance,
            status: newStatus
        }

        // Update paid_date: set if fully paid, clear if not fully paid
        if (newStatus === 'paid') {
            updateData.paid_date = new Date().toISOString()
        } else if (newStatus === 'unpaid' || newStatus === 'partially_paid') {
            updateData.paid_date = null
        }

        const { error: updateError, data: updatedInvoice } = await supabase
            .from('invoices_table')
            .update(updateData)
            .eq('invoice_number', invoiceNumber)
            .select('amount_paid, outstanding_balance, status')
            .single()

        if (updateError) {
            console.error('Error archiving payment:', updateError)
            throw new Error(`Failed to archive payment: ${updateError.message}`)
        }

        // Verify the update worked correctly
        if (updatedInvoice) {
            const actualAmountPaid = Number(updatedInvoice.amount_paid) || 0
            if (Math.abs(actualAmountPaid - newAmountPaid) > 0.01) {
                console.warn(`Payment deletion: Expected amount_paid ${newAmountPaid}, but got ${actualAmountPaid}. Database trigger may have overridden the value.`)
                // Try one more time with explicit values
                await supabase
                    .from('invoices_table')
                    .update({ 
                        amount_paid: newAmountPaid,
                        outstanding_balance: newOutstandingBalance,
                        status: newStatus
                    })
                    .eq('invoice_number', invoiceNumber)
            }
        }
    }

    /**
     * Get all payments (including deleted/archived) for reporting
     */
    static async getAllPayments(
        invoiceNumber: string,
        includeDeleted: boolean = false
    ): Promise<Payment[]> {
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices_table')
            .select('payments')
            .eq('invoice_number', invoiceNumber)
            .single()

        if (fetchError || !invoice) {
            throw new Error(`Invoice not found: ${invoiceNumber}`)
        }

        const payments = (invoice.payments as Payment[]) || []
        
        if (includeDeleted) {
            return payments
        }
        
        return payments.filter(p => !p.deleted)
    }

    /**
     * Get archived/deleted payments for reporting
     */
    static async getArchivedPayments(invoiceNumber: string): Promise<Payment[]> {
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices_table')
            .select('payments')
            .eq('invoice_number', invoiceNumber)
            .single()

        if (fetchError || !invoice) {
            throw new Error(`Invoice not found: ${invoiceNumber}`)
        }

        const payments = (invoice.payments as Payment[]) || []
        return payments.filter(p => p.deleted === true)
    }
}

