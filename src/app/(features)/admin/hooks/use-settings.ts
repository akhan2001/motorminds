'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SettingsService } from '../lib/settings-service'
import { useAdminContext } from '../components/admin-context/useAdminContext'
import type { PlatformSettings, OrganizationSettings, ShopSettings } from '../types/settings'
import { toast } from 'sonner'

export function usePlatformSettings() {
    return useQuery<PlatformSettings>({
        queryKey: ['admin', 'settings', 'platform'],
        queryFn: () => SettingsService.getPlatformSettings(),
        staleTime: 60000 // 1 minute
    })
}

export function useUpdatePlatformSettings() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (settings: Partial<PlatformSettings>) => 
            SettingsService.updatePlatformSettings(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'platform'] })
            toast.success('Platform settings updated successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update platform settings')
        }
    })
}

export function useOrganizationSettings() {
    const { organizationId } = useAdminContext()

    return useQuery<OrganizationSettings>({
        queryKey: ['admin', 'settings', 'organization', organizationId],
        queryFn: () => SettingsService.getOrganizationSettings(),
        enabled: !!organizationId,
        staleTime: 60000
    })
}

export function useUpdateOrganizationSettings() {
    const queryClient = useQueryClient()
    const { organizationId } = useAdminContext()

    return useMutation({
        mutationFn: (settings: Partial<OrganizationSettings>) => 
            SettingsService.updateOrganizationSettings(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'organization', organizationId] })
            toast.success('Organization settings updated successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update organization settings')
        }
    })
}

export function useShopSettings() {
    const { shopId } = useAdminContext()

    return useQuery<ShopSettings>({
        queryKey: ['admin', 'settings', 'shop', shopId],
        queryFn: () => SettingsService.getShopSettings(),
        enabled: !!shopId,
        staleTime: 60000
    })
}

export function useUpdateShopSettings() {
    const queryClient = useQueryClient()
    const { shopId } = useAdminContext()

    return useMutation({
        mutationFn: (settings: Partial<ShopSettings>) => 
            SettingsService.updateShopSettings(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'shop', shopId] })
            toast.success('Shop settings updated successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update shop settings')
        }
    })
}

