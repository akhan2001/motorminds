import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InvoicePaymentService } from '../lib/invoice-payment-service'
import type { Payment } from '../types/invoice'
import { toast } from 'sonner'

export function useAddInvoicePayment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            invoiceNumber,
            payment
        }: {
            invoiceNumber: string
            payment: Omit<Payment, 'id' | 'created_at'>
        }) => {
            return InvoicePaymentService.addPayment(invoiceNumber, payment)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceNumber] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
            toast.success('Payment recorded successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to record payment')
        }
    })
}

export function useRemoveInvoicePayment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            invoiceNumber,
            paymentId,
            deletionReason
        }: {
            invoiceNumber: string
            paymentId: string
            deletionReason?: string
        }) => {
            return InvoicePaymentService.removePayment(invoiceNumber, paymentId, deletionReason)
        },
        onSuccess: (_, variables) => {
            // Invalidate all invoice-related queries to ensure UI updates
            // Use partial matching to catch all variations of the invoice query key
            queryClient.invalidateQueries({ 
                predicate: (query) => {
                    const queryKey = query.queryKey
                    return (
                        queryKey[0] === 'invoice' && queryKey[1] === variables.invoiceNumber
                    ) || (
                        queryKey[0] === 'invoices'
                    ) || (
                        queryKey[0] === 'invoice-stats'
                    )
                }
            })
            toast.success('Payment archived successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to archive payment')
        }
    })
}

