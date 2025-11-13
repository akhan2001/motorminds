'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminContext } from '../components/admin-context/useAdminContext'
import type { Shop } from '../types/admin'
import { toast } from 'sonner'

export function useShops() {
    const { adminType, organizationId, shopId } = useAdminContext()

    return useQuery({
        queryKey: ['admin', 'shops', adminType, organizationId, shopId],
        queryFn: async () => {
            const url = adminType === 'super-admin' 
                ? '/api/admin/shops?super_admin=true'
                : '/api/admin/shops'
            
            const response = await fetch(url)
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch shops')
            }
            
            return data.shops || []
        },
        enabled: !!adminType,
        staleTime: 30000
    })
}

export function useShop(id: string | null) {
    return useQuery({
        queryKey: ['admin', 'shops', id],
        queryFn: async () => {
            if (!id) return null
            
            const response = await fetch(`/api/admin/shop/${id}`)
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch shop')
            }
            
            return data.shop
        },
        enabled: !!id,
        staleTime: 30000
    })
}

export function useUpdateShop() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Shop> }) => {
            const response = await fetch(`/api/admin/shop/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to update shop')
            }
            
            return result.shop
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'shops', variables.id] })
            toast.success('Shop updated successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update shop')
        }
    })
}

export function useDeleteShop() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/admin/shop/${id}`, {
                method: 'DELETE'
            })
            
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete shop')
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] })
            toast.success('Shop deleted successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete shop')
        }
    })
}

