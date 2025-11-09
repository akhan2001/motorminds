// Custom hooks for status tracker preset management
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { statusTrackerService } from '../lib/status-tracker-service'
import type { StatusTrackerPreset, StatusTrackerPresetCreateData } from '../types/status-tracker'
import { toast } from 'sonner'

// Query keys
export const statusTrackerKeys = {
    all: ['status-trackers'] as const,
    lists: () => [...statusTrackerKeys.all, 'list'] as const,
    list: (shopId: string) => [...statusTrackerKeys.lists(), shopId] as const,
}

/**
 * Hook to fetch status tracker presets for a shop
 */
export function useStatusTrackerPresets(shopId: string) {
    return useQuery({
        queryKey: statusTrackerKeys.list(shopId),
        queryFn: () => statusTrackerService.getStatusTrackerPresets(shopId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!shopId && shopId !== '',
    })
}

/**
 * Hook to add a new status tracker preset
 */
export function useAddStatusTrackerPreset() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ shopId, data }: { shopId: string; data: StatusTrackerPresetCreateData }) =>
            statusTrackerService.addStatusTrackerPreset(shopId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: statusTrackerKeys.list(variables.shopId) })
            toast.success('Status tracker preset created')
        },
        onError: (error: Error) => {
            console.error('Failed to create status tracker preset:', error)
            toast.error(error.message || 'Failed to create status tracker preset')
        },
    })
}

/**
 * Hook to update a status tracker preset
 */
export function useUpdateStatusTrackerPreset() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({
            shopId,
            presetId,
            updates,
        }: {
            shopId: string
            presetId: string
            updates: Partial<StatusTrackerPresetCreateData>
        }) => statusTrackerService.updateStatusTrackerPreset(shopId, presetId, updates),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: statusTrackerKeys.list(variables.shopId) })
            toast.success('Status tracker preset updated')
        },
        onError: (error: Error) => {
            console.error('Failed to update status tracker preset:', error)
            toast.error(error.message || 'Failed to update status tracker preset')
        },
    })
}

/**
 * Hook to delete a status tracker preset
 */
export function useDeleteStatusTrackerPreset() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ shopId, presetId }: { shopId: string; presetId: string }) =>
            statusTrackerService.deleteStatusTrackerPreset(shopId, presetId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: statusTrackerKeys.list(variables.shopId) })
            toast.success('Status tracker preset deleted')
        },
        onError: (error: Error) => {
            console.error('Failed to delete status tracker preset:', error)
            toast.error(error.message || 'Failed to delete status tracker preset')
        },
    })
}

/**
 * Hook to reorder status tracker presets
 */
export function useReorderStatusTrackerPresets() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ shopId, presetIds }: { shopId: string; presetIds: string[] }) =>
            statusTrackerService.reorderStatusTrackerPresets(shopId, presetIds),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: statusTrackerKeys.list(variables.shopId) })
        },
        onError: (error: Error) => {
            console.error('Failed to reorder status tracker presets:', error)
            toast.error(error.message || 'Failed to reorder status tracker presets')
        },
    })
}

