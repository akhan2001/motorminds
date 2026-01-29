import type { Payment } from '../types/invoice'

/**
 * Merge advance payments from work order into invoice payments
 * Ensures idempotent behavior - won't create duplicate payments
 * 
 * @param existingInvoicePayments - Current payments on the invoice
 * @param workOrderAdvancePayments - Advance payments from the work order
 * @returns Merged payments array with advance payments added (if not already present)
 */
export function mergeAdvancePaymentsIntoInvoice(
    existingInvoicePayments: Payment[] = [],
    workOrderAdvancePayments: Payment[] = []
): Payment[] {
    if (!workOrderAdvancePayments || workOrderAdvancePayments.length === 0) {
        return existingInvoicePayments
    }

    // Get active (non-deleted) payments from invoice
    const activeInvoicePayments = existingInvoicePayments.filter(p => !p.deleted)
    
    // Create a Set of payment IDs that already exist in the invoice
    // Use payment ID as the unique identifier for idempotency
    const existingPaymentIds = new Set(
        activeInvoicePayments.map(p => p.id)
    )

    // Filter advance payments to only include those not already in the invoice
    // This ensures idempotent behavior - re-syncing won't create duplicates
    const newAdvancePayments = workOrderAdvancePayments.filter(
        advancePayment => !existingPaymentIds.has(advancePayment.id)
    )

    // If no new advance payments to add, return existing payments
    if (newAdvancePayments.length === 0) {
        return existingInvoicePayments
    }

    // Merge: existing payments + new advance payments
    // Preserve deleted payments in the array for audit trail
    return [...existingInvoicePayments, ...newAdvancePayments]
}

/**
 * Calculate invoice payment totals from payments array
 * 
 * @param payments - Array of payments (including deleted ones)
 * @param totalAmount - Total invoice amount
 * @returns Object with amount_paid, outstanding_balance, and status
 */
export function calculateInvoicePaymentTotals(
    payments: Payment[] = [],
    totalAmount: number
): {
    amount_paid: number
    outstanding_balance: number
    status: 'paid' | 'unpaid' | 'partially_paid'
} {
    // Get active (non-deleted) payments
    const activePayments = payments.filter(p => !p.deleted)
    
    // Calculate total amount paid
    const amount_paid = activePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    
    // Calculate outstanding balance (can't be negative)
    const outstanding_balance = Math.max(0, totalAmount - amount_paid)
    
    // Determine status
    let status: 'paid' | 'unpaid' | 'partially_paid'
    if (totalAmount === 0 && activePayments.length > 0) {
        // $0 invoice with any payment should be marked as paid
        status = 'paid'
    } else if (amount_paid === 0) {
        status = 'unpaid'
    } else if (amount_paid >= totalAmount) {
        status = 'paid'
    } else {
        status = 'partially_paid'
    }

    return {
        amount_paid,
        outstanding_balance,
        status
    }
}
