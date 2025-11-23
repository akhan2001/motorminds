'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OrganizationService } from '../lib/organization-service'
import type { Organization, OrganizationCreateData, OrganizationUpdateData } from '../types/organization'
import { toast } from 'sonner'

export function useOrganizations() {
    return useQuery({
        queryKey: ['admin', 'organizations'],
        queryFn: () => OrganizationService.getAllOrganizations(),
        staleTime: 30000 // 30 seconds
    })
}

export function useOrganization(id: string | null) {
    return useQuery({
        queryKey: ['admin', 'organizations', id],
        queryFn: () => id ? OrganizationService.getOrganizationById(id) : null,
        enabled: !!id,
        staleTime: 30000
    })
}

export function useCreateOrganization() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: OrganizationCreateData) => OrganizationService.createOrganization(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] })
            toast.success('Organization created successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create organization')
        }
    })
}

export function useUpdateOrganization() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: OrganizationUpdateData }) => 
            OrganizationService.updateOrganization(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'organizations', variables.id] })
            toast.success('Organization updated successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update organization')
        }
    })
}

export function useDeleteOrganization() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => OrganizationService.deleteOrganization(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] })
            toast.success('Organization deleted successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete organization')
        }
    })
}

export function useOrganizationShops(organizationId: string | null) {
    return useQuery({
        queryKey: ['admin', 'organizations', organizationId, 'shops'],
        queryFn: () => organizationId ? OrganizationService.getOrganizationShops(organizationId) : [],
        enabled: !!organizationId,
        staleTime: 30000
    })
}

