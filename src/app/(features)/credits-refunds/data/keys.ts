/**
 * React Query Keys for Credits & Refunds Data
 */

import type { CreditRefundFilters } from '../types/credits-refunds'

export const creditsRefundsKeys = {
    all: (shopId: string | null) => ['creditsRefunds', shopId].filter(Boolean) as const,

    lists: (shopId: string | null) => [...creditsRefundsKeys.all(shopId), 'list'] as const,

    list: (shopId: string | null, filters?: CreditRefundFilters) =>
        [...creditsRefundsKeys.lists(shopId), filters ?? {}] as const,

    details: (shopId: string | null) => [...creditsRefundsKeys.all(shopId), 'detail'] as const,
    detail: (shopId: string | null, id: string) =>
        [...creditsRefundsKeys.details(shopId), id] as const,

    summary: (shopId: string | null, dateFrom?: string, dateTo?: string) =>
        [...creditsRefundsKeys.all(shopId), 'summary', dateFrom, dateTo].filter(Boolean) as const,
}
