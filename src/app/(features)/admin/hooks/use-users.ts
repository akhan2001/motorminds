'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminContext } from '../components/admin-context/useAdminContext'
import type { User } from '../types/admin'
import { toast } from 'sonner'

export function useUsers() {
    const { adminType, organizationId, shopId } = useAdminContext()

    return useQuery({
        queryKey: ['admin', 'users', adminType, organizationId, shopId],
        queryFn: async () => {
            const response = await fetch('/api/admin/users')
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch users')
            }
            
            return data.users || []
        },
        enabled: !!adminType,
        staleTime: 30000
    })
}

export function useUser(id: string | null) {
    return useQuery({
        queryKey: ['admin', 'users', id],
        queryFn: async () => {
            if (!id) return null
            
            const response = await fetch(`/api/admin/users/${id}`)
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch user')
            }
            
            return data.user
        },
        enabled: !!id,
        staleTime: 30000
    })
}

export function useUpdateUserStatus() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
            const response = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update user status')
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
            toast.success('User status updated successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update user status')
        }
    })
}

export function useUpdateUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to update user')
            }
            
            return result.user
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'users', variables.id] })
            toast.success('User updated successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update user')
        }
    })
}

export function useDeleteUser() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE'
            })
            
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete user')
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
            toast.success('User deleted successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete user')
        }
    })
}

