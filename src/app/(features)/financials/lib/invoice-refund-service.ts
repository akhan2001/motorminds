import { createClient } from '@/utils/supabase/client'
import type { InvoiceRefund } from '../types/invoice'

const supabase = createClient()

export class InvoiceRefundService {
    /**
     * Issue a refund against an invoice.
     * Validates that refund does not exceed (amount_paid - total_refunded).
     * Transitions status to 'refunded' when total_refunded >= amount_paid.
     */
    static async addRefund(
        invoiceNumber: string,
        refund: Omit<InvoiceRefund, 'id' | 'created_at'>
    ): Promise<void> {
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices_table')
            .select('refunds, total_refunded, amount_paid, total_amount, status')
            .eq('invoice_number', invoiceNumber)
            .single()

        if (fetchError || !invoice) {
            throw new Error(`Invoice not found: ${invoiceNumber}`)
        }

        const currentRefunds = (invoice.refunds as InvoiceRefund[]) || []
        const currentTotalRefunded = Number(invoice.total_refunded) || 0
        const amountPaid = Number(invoice.amount_paid) || 0
        const maxRefundable = amountPaid - currentTotalRefunded

        if (refund.amount <= 0) {
            throw new Error('Refund amount must be greater than zero')
        }

        if ((refund.amount - maxRefundable) > 0.01) {
            throw new Error(
                `Refund amount exceeds the refundable balance of ${maxRefundable.toFixed(2)}`
            )
        }

        const newRefund: InvoiceRefund = {
            id: crypto.randomUUID(),
            ...refund,
            created_at: new Date().toISOString(),
            deleted: false,
        }

        const updatedRefunds = [...currentRefunds, newRefund]
        const activeRefunds = updatedRefunds.filter(r => !r.deleted)
        const newTotalRefunded = activeRefunds.reduce((sum, r) => sum + (r.amount || 0), 0)

        // Status: refunded when all paid amount has been refunded back
        const newStatus = newTotalRefunded >= amountPaid && amountPaid > 0
            ? 'refunded'
            : invoice.status

        const updateData: Record<string, unknown> = {
            refunds: updatedRefunds,
            total_refunded: newTotalRefunded,
            status: newStatus,
            updated_at: new Date().toISOString(),
        }

        const { error: updateError } = await supabase
            .from('invoices_table')
            .update(updateData)
            .eq('invoice_number', invoiceNumber)

        if (updateError) {
            console.error('Error adding refund:', updateError)
            throw new Error(`Failed to add refund: ${updateError.message}`)
        }
    }

    /**
     * Soft-delete a refund (keeps it for audit trail).
     * Recalculates total_refunded and status after removal.
     */
    static async removeRefund(
        invoiceNumber: string,
        refundId: string,
        deletionReason?: string
    ): Promise<void> {
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices_table')
            .select('refunds, amount_paid, total_amount, status')
            .eq('invoice_number', invoiceNumber)
            .single()

        if (fetchError || !invoice) {
            throw new Error(`Invoice not found: ${invoiceNumber}`)
        }

        const currentRefunds = (invoice.refunds as InvoiceRefund[]) || []

        const updatedRefunds = currentRefunds.map(r => {
            if (r.id === refundId) {
                return {
                    ...r,
                    deleted: true,
                    deleted_at: new Date().toISOString(),
                    deletion_reason: deletionReason || null,
                }
            }
            return r
        })

        const activeRefunds = updatedRefunds.filter(r => !r.deleted)
        const newTotalRefunded = activeRefunds.reduce((sum, r) => sum + (r.amount || 0), 0)
        const amountPaid = Number(invoice.amount_paid) || 0
        const totalAmount = Number(invoice.total_amount) || 0

        // Revert status back to payment-based status now that refund is removed
        let newStatus: string
        if (newTotalRefunded >= amountPaid && amountPaid > 0) {
            newStatus = 'refunded'
        } else if (amountPaid === 0) {
            newStatus = 'unpaid'
        } else if (amountPaid >= totalAmount) {
            newStatus = 'paid'
        } else {
            newStatus = 'partially_paid'
        }

        const { error: updateError, data: updatedInvoice } = await supabase
            .from('invoices_table')
            .update({
                refunds: updatedRefunds,
                total_refunded: newTotalRefunded,
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('invoice_number', invoiceNumber)
            .select('total_refunded, status')
            .single()

        if (updateError) {
            console.error('Error removing refund:', updateError)
            throw new Error(`Failed to remove refund: ${updateError.message}`)
        }

        // Force-update if database trigger interfered (mirrors invoice-payment-service pattern)
        if (updatedInvoice) {
            const actualTotalRefunded = Number(updatedInvoice.total_refunded) || 0
            const actualStatus = updatedInvoice.status

            if (Math.abs(actualTotalRefunded - newTotalRefunded) > 0.01 || actualStatus !== newStatus) {
                console.warn('Refund removal: values may not have updated correctly, forcing update.')
                const { error: forceUpdateError } = await supabase
                    .from('invoices_table')
                    .update({
                        total_refunded: newTotalRefunded,
                        status: newStatus,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('invoice_number', invoiceNumber)

                if (forceUpdateError) {
                    console.error('Force update failed:', forceUpdateError)
                }
            }
        }
    }
}
