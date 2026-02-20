/**
 * Query Hook for Credits & Refunds
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { CreditsRefundsService } from '../lib/credits-refunds-service'
import type { CreditRefundFilters } from '../types/credits-refunds'
import { creditsRefundsKeys } from './keys'

export interface CreditsRefundsQueryResponse {
    creditsRefunds: import('../types/credits-refunds').CreditRefundItem[]
    total: number
    stats?: {
        totalAmount: number
        count: number
        byStatus: Record<string, { count: number; total: number }>
    }
}

async function getCreditsRefunds(
    shopId: string,
    filters: CreditRefundFilters,
    signal?: AbortSignal
): Promise<CreditsRefundsQueryResponse> {
    const serviceFilters = {
        date_from: filters.startDate ? filters.startDate.split('T')[0] : undefined,
        date_to: filters.endDate ? filters.endDate.split('T')[0] : undefined,
        supplier: filters.supplier,
        status: filters.status,
        amount_min: filters.amount_min,
        amount_max: filters.amount_max,
        search: filters.search,
        archived: filters.archived,
    }

    const response = await CreditsRefundsService.getCreditsRefunds(shopId, serviceFilters)

    const stats = await CreditsRefundsService.getSummary(
        shopId,
        serviceFilters.date_from,
        serviceFilters.date_to
    )

    return {
        creditsRefunds: response.creditsRefunds,
        total: response.total,
        stats: {
            totalAmount: stats.totalAmount,
            count: stats.count,
            byStatus: stats.byStatus,
        },
    }
}

export interface CreditsRefundsFilters {
    startDate?: string
    endDate?: string
    vendor?: string
    status?: 'pending' | 'processed' | 'reconciled'
    amount_min?: number
    amount_max?: number
    search?: string
    archived?: boolean
}

export function useCreditsRefundsQuery(
    shopId: string | null,
    options?: {
        filters?: CreditsRefundsFilters
        enabled?: boolean
    }
) {
    const { filters = {}, enabled = true } = options || {}

    const serviceFilters: CreditRefundFilters = {
        date_from: filters.startDate,
        date_to: filters.endDate,
        supplier: filters.supplier,
        status: filters.status,
        amount_min: filters.amount_min,
        amount_max: filters.amount_max,
        search: filters.search,
        archived: filters.archived,
    }

    return useQuery<CreditsRefundsQueryResponse>({
        queryKey: creditsRefundsKeys.list(shopId, serviceFilters),
        queryFn: ({ signal }) => getCreditsRefunds(shopId!, serviceFilters, signal),
        enabled: enabled && !!shopId,
        staleTime: 30000,
    })
}
