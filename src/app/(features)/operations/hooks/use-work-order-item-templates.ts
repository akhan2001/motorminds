// React Query hooks for Work Order Item Templates
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { WorkOrderItemTemplatesService } from '../lib/work-order-item-templates-service'
import type { 
    WorkOrderItemTemplate, 
    WorkOrderItemTemplateCreateData, 
    WorkOrderItemTemplateUpdateData,
    CloneTemplateToWorkOrderData 
} from '../types/work-order-item-templates'

// Query keys for work order item templates
export const workOrderItemTemplateKeys = {
    all: ['work-order-item-templates'] as const,
    lists: () => [...workOrderItemTemplateKeys.all, 'list'] as const,
    list: (shopId: string) => [...workOrderItemTemplateKeys.lists(), shopId] as const,
    byCategory: (shopId: string, category: string) => [...workOrderItemTemplateKeys.all, 'by-category', shopId, category] as const,
    details: () => [...workOrderItemTemplateKeys.all, 'detail'] as const,
    detail: (id: string) => [...workOrderItemTemplateKeys.details(), id] as const,
    categories: (shopId: string) => [...workOrderItemTemplateKeys.all, 'categories', shopId] as const,
}

/**
 * Hook to fetch all templates for a shop
 */
export function useWorkOrderItemTemplates(shopId: string) {
    return useQuery({
        queryKey: workOrderItemTemplateKeys.list(shopId),
        queryFn: () => WorkOrderItemTemplatesService.getTemplatesByShopId(shopId),
        enabled: !!shopId,
        staleTime: 30 * 1000, // 30 seconds
    })
}

/**
 * Hook to fetch templates by category
 */
export function useWorkOrderItemTemplatesByCategory(shopId: string, category: string) {
    return useQuery({
        queryKey: workOrderItemTemplateKeys.byCategory(shopId, category),
        queryFn: () => WorkOrderItemTemplatesService.getTemplatesByCategory(shopId, category),
        enabled: !!shopId && !!category,
        staleTime: 30 * 1000,
    })
}

/**
 * Hook to fetch a single template
 */
export function useWorkOrderItemTemplate(templateId: string) {
    return useQuery({
        queryKey: workOrderItemTemplateKeys.detail(templateId),
        queryFn: () => WorkOrderItemTemplatesService.getTemplate(templateId),
        enabled: !!templateId,
        staleTime: 30 * 1000,
    })
}

/**
 * Hook to fetch categories for a shop
 */
export function useWorkOrderItemTemplateCategories(shopId: string) {
    return useQuery({
        queryKey: workOrderItemTemplateKeys.categories(shopId),
        queryFn: () => WorkOrderItemTemplatesService.getCategoriesByShopId(shopId),
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook to create a new template
 */
export function useCreateWorkOrderItemTemplate() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: WorkOrderItemTemplateCreateData) =>
            WorkOrderItemTemplatesService.createTemplate(data),
        onSuccess: (newTemplate) => {
            // Invalidate and refetch templates for this shop
            queryClient.invalidateQueries({ 
                queryKey: workOrderItemTemplateKeys.list(newTemplate.shop_id) 
            })
            queryClient.invalidateQueries({ 
                queryKey: workOrderItemTemplateKeys.categories(newTemplate.shop_id) 
            })
            
            toast.success('Template created successfully')
        },
        onError: (error: any) => {
            console.error('Failed to create template:', error)
            toast.error(error.message || 'Failed to create template')
        },
    })
}

/**
 * Hook to update a template
 */
export function useUpdateWorkOrderItemTemplate() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: WorkOrderItemTemplateUpdateData }) =>
            WorkOrderItemTemplatesService.updateTemplate(id, data),
        onSuccess: (updatedTemplate) => {
            // Update the specific template in cache
            queryClient.setQueryData(
                workOrderItemTemplateKeys.detail(updatedTemplate.id),
                updatedTemplate
            )
            
            // Invalidate lists to refetch
            queryClient.invalidateQueries({ 
                queryKey: workOrderItemTemplateKeys.list(updatedTemplate.shop_id) 
            })
            
            toast.success('Template updated successfully')
        },
        onError: (error: any) => {
            console.error('Failed to update template:', error)
            toast.error(error.message || 'Failed to update template')
        },
    })
}

/**
 * Hook to delete a template
 */
export function useDeleteWorkOrderItemTemplate() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (templateId: string) => WorkOrderItemTemplatesService.deleteTemplate(templateId),
        onMutate: async (templateId) => {
            // Get the template to know which shop to invalidate
            const template = queryClient.getQueryData<WorkOrderItemTemplate>(
                workOrderItemTemplateKeys.detail(templateId)
            )
            return { shopId: template?.shop_id }
        },
        onSuccess: (_, templateId, context) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: workOrderItemTemplateKeys.detail(templateId) })
            
            // Invalidate lists to refetch if we know the shop ID
            if (context?.shopId) {
                queryClient.invalidateQueries({ 
                    queryKey: workOrderItemTemplateKeys.list(context.shopId) 
                })
                queryClient.invalidateQueries({ 
                    queryKey: workOrderItemTemplateKeys.categories(context.shopId) 
                })
            } else {
                // Fallback: invalidate all lists
                queryClient.invalidateQueries({ queryKey: workOrderItemTemplateKeys.lists() })
            }
            
            toast.success('Template deleted successfully')
        },
        onError: (error: any) => {
            console.error('Failed to delete template:', error)
            toast.error(error.message || 'Failed to delete template')
        },
    })
}

/**
 * Hook to clone a template to a work order
 */
export function useCloneTemplateToWorkOrder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: CloneTemplateToWorkOrderData) =>
            WorkOrderItemTemplatesService.cloneTemplateToWorkOrder(data),
        onSuccess: (newItem, { work_order_id }) => {
            // Invalidate work order items for the target work order
            queryClient.invalidateQueries({ 
                queryKey: ['work-order-items', 'list', work_order_id] 
            })
            
            toast.success('Template added to work order successfully')
        },
        onError: (error: any) => {
            console.error('Failed to clone template:', error)
            toast.error(error.message || 'Failed to add template to work order')
        },
    })
}
