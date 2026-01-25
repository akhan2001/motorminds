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
            paymentId
        }: {
            invoiceNumber: string
            paymentId: string
        }) => {
            return InvoicePaymentService.removePayment(invoiceNumber, paymentId)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceNumber] })
            queryClient.invalidateQueries({ queryKey: ['invoices'] })
            queryClient.invalidateQueries({ queryKey: ['invoice-stats'] })
            toast.success('Payment removed successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to remove payment')
        }
    })
}

