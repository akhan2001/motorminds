import { useMutation, useQueryClient } from '@tanstack/react-query'
import { WorkOrderAdvancePaymentService } from '../lib/work-order-advance-payment-service'
import type { Payment } from '../../financials/types/invoice'
import { toast } from 'sonner'

export function useAddWorkOrderAdvancePayment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            workOrderId,
            payment
        }: {
            workOrderId: string
            payment: Omit<Payment, 'id' | 'created_at'>
        }) => {
            return WorkOrderAdvancePaymentService.addAdvancePayment(workOrderId, payment)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['work-order', variables.workOrderId] })
            queryClient.invalidateQueries({ queryKey: ['work-orders'] })
            queryClient.invalidateQueries({ queryKey: ['work-order-items', variables.workOrderId] })
            toast.success('Advance payment recorded successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to record advance payment')
        }
    })
}

export function useRemoveWorkOrderAdvancePayment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            workOrderId,
            paymentId,
            deletionReason
        }: {
            workOrderId: string
            paymentId: string
            deletionReason?: string
        }) => {
            return WorkOrderAdvancePaymentService.removeAdvancePayment(workOrderId, paymentId, deletionReason)
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['work-order', variables.workOrderId] })
            queryClient.invalidateQueries({ queryKey: ['work-orders'] })
            queryClient.invalidateQueries({ queryKey: ['work-order-items', variables.workOrderId] })
            toast.success('Advance payment archived successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to archive advance payment')
        }
    })
}
