'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CreditsRefundsService } from '../lib/credits-refunds-service'
import type {
    CreditRefundItem,
    CreateCreditRefundRequest,
    UpdateCreditRefundRequest,
} from '../types/credits-refunds'
import { creditsRefundsKeys } from '../data/keys'
import { useAuth } from '@/app/(features)/operations/hooks/use-auth'

export function useCreateCreditRefund() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: (data: CreateCreditRefundRequest) =>
            CreditsRefundsService.createCreditRefund(shopId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: creditsRefundsKeys.all(shopId!) })
            toast.success('Credit/refund created')
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to create credit/refund')
        },
    })
}

export function useUpdateCreditRefund() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string
            data: UpdateCreditRefundRequest
        }) => CreditsRefundsService.updateCreditRefund(id, shopId!, data),
        onSuccess: (data: CreditRefundItem) => {
            queryClient.invalidateQueries({
                queryKey: creditsRefundsKeys.detail(shopId!, data.id),
            })
            queryClient.invalidateQueries({ queryKey: creditsRefundsKeys.all(shopId!) })
            toast.success('Credit/refund updated')
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to update credit/refund')
        },
    })
}

export function useArchiveCreditRefund() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: (id: string) => CreditsRefundsService.archiveCreditRefund(id, shopId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: creditsRefundsKeys.all(shopId!) })
            toast.success('Credit/refund archived')
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to archive credit/refund')
        },
    })
}

export function useDeleteCreditRefund() {
    const queryClient = useQueryClient()
    const { shopId } = useAuth()

    return useMutation({
        mutationFn: (id: string) => CreditsRefundsService.deleteCreditRefund(id, shopId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: creditsRefundsKeys.all(shopId!) })
            toast.success('Credit/refund deleted')
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to delete credit/refund')
        },
    })
}
