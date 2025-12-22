// src/app/(features)/operations/hooks/work-orders/use-work-order-permissions.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { workOrderPermissions } from '../../lib/work-order-permissions'

const supabase = createClient()

/**
 * Hook to check if current user can delete work orders
 */
export function useCanDeleteWorkOrders(shopId: string | undefined) {
    return useQuery({
        queryKey: ['work-order-permissions', 'delete', shopId],
        queryFn: async () => {
            if (!shopId) return false

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return false

            return await workOrderPermissions.canDeleteWorkOrder(user.id, shopId)
        },
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    })
}

/**
 * Hook to check if current user is admin
 */
export function useIsAdmin() {
    return useQuery({
        queryKey: ['user-permissions', 'is-admin'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return false

            return await workOrderPermissions.isAdmin(user.id)
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    })
}

/**
 * Hook to check if a specific work order can be edited
 */
export function useCanEditWorkOrder(workOrderId: string | undefined) {
    return useQuery({
        queryKey: ['work-order-permissions', 'edit', workOrderId],
        queryFn: async () => {
            if (!workOrderId) return { canEdit: false, reason: 'No work order ID' }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { canEdit: false, reason: 'Not authenticated' }

            return await workOrderPermissions.canEditWorkOrder(workOrderId, user.id)
        },
        enabled: !!workOrderId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}

