// Work Order Items service for API interactions
import { createClient } from '@/utils/supabase/client'
import {
    WorkOrderItemSchema,
    WorkOrderItemCreateSchema,
    WorkOrderItemUpdateSchema,
    WorkOrderItemSummarySchema,
    type WorkOrderItem,
    type WorkOrderItemCreateData,
    type WorkOrderItemUpdateData,
    type WorkOrderItemSummary,
} from '../lib/validations/work-order-items'
import type { WorkOrderItemFormData } from '../types/work-order-items'

const supabase = createClient()

export class WorkOrderItemsService {

    /**
     * Get all items for a specific work order
     * Includes technician information for labor items
     */
    static async getWorkOrderItems(workOrderId: string): Promise<WorkOrderItem[]> {
        if (!workOrderId) {
            throw new Error('Work Order ID is required')
        }

        const { data, error } = await supabase
            .from('work_order_items')
            .select(`
                *,
                technician:employees(id, first_name, last_name)
            `)
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching work order items:', error)
            throw new Error(`Failed to fetch work order items: ${error.message}`)
        }

        return data || []
    }

    static async getWorkOrderItemsByShopId(shopId: string): Promise<WorkOrderItem[]> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        const { data, error } = await supabase
            .from('work_order_items')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching work order items:', error)
            throw new Error(`Failed to fetch work order items: ${error.message}`)
        }

        // Validate and return array (use passthrough to allow extra fields)
        return (data || []).map(item => WorkOrderItemSchema.passthrough().parse(item))
    }

    /**
     * Get all items for a specific work order with pagination
     */
    static async getWorkOrderItemsPaginated(
        workOrderId: string,
        options?: { page?: number; pageSize?: number }
    ): Promise<{ data: WorkOrderItem[]; count: number }> {
        if (!workOrderId) {
            throw new Error('Work Order ID is required')
        }

        const page = options?.page || 1
        const pageSize = options?.pageSize || 50
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data, error, count } = await supabase
            .from('work_order_items')
            .select('*', { count: 'exact' })
            .eq('work_order_id', workOrderId)
            .order('created_at', { ascending: true })
            .range(from, to)

        if (error) {
            console.error('Error fetching work order items:', error)
            throw new Error(`Failed to fetch work order items: ${error.message}`)
        }

        // Validate and return
        return {
            data: (data || []).map(item => WorkOrderItemSchema.parse(item)),
            count: count || 0
        }
    }

    /**
     * Get a single work order item by ID
     */
    static async getWorkOrderItem(itemId: string): Promise<WorkOrderItem> {
        if (!itemId) {
            throw new Error('Item ID is required')
        }

        const { data, error } = await supabase
            .from('work_order_items')
            .select('*')
            .eq('id', itemId)
            .single()

        if (error) {
            // PGRST116 is "not found" - don't log as error since it's expected in some flows
            if (error.code === 'PGRST116') {
                throw new Error(`Work order item with ID ${itemId} not found`)
            }
            // Only log unexpected errors
            console.error('Error fetching work order item:', error)
            throw new Error(`Failed to fetch work order item: ${error.message}`)
        }

        return data
    }

    /**
     * Create a new work order item
     * Note: total_price and total_cost are calculated by database trigger
     * Requires database trigger 'item_total_calculation' to be active
     */
    static async createWorkOrderItem(itemData: WorkOrderItemCreateData): Promise<WorkOrderItem> {
        // Pre-process: Convert empty strings to null/undefined for optional UUID fields
        const processedData = {
            ...itemData,
            technician_id: itemData.technician_id && itemData.technician_id.trim() !== '' 
                ? itemData.technician_id 
                : undefined,
        }

        // Validate input with Zod
        let validated: WorkOrderItemCreateData
        try {
            validated = WorkOrderItemCreateSchema.parse(processedData)
        } catch (validationError: any) {
            // Format Zod errors for better debugging
            const errorMessages = validationError.errors?.map((err: any) => 
                `${err.path.join('.')}: ${err.message}`
            ).join(', ') || validationError.message || 'Validation failed'
            
            console.error('Validation error creating work order item:', {
                itemData: processedData,
                errors: validationError.errors || validationError
            })
            throw new Error(`Invalid item data: ${errorMessages}`)
        }

        // Get shop_id from the work order (required for RLS)
        const { data: workOrder, error: workOrderError } = await supabase
            .from('work_orders')
            .select('shop_id')
            .eq('id', validated.work_order_id)
            .single()

        if (workOrderError || !workOrder) {
            throw new Error('Work order not found')
        }

        // Prepare payload (database trigger will calculate total_price and total_cost)
        const itemPayload = {
            work_order_id: validated.work_order_id,
            shop_id: workOrder.shop_id,
            item_type: validated.item_type,
            description: validated.description.trim(),
            part_number: validated.part_number?.trim() || null,
            quantity: validated.quantity,
            unit_price: validated.unit_price,
            unit_cost: validated.unit_cost ?? null,
            supplier: validated.supplier?.trim() || null,
            category: validated.category?.trim() || null,
            warranty_period: validated.warranty_period?.trim() || null,
            notes: validated.notes?.trim() || null,
            labor_hours: validated.labor_hours ?? null,
            technician_id: validated.technician_id ?? null,
        }

        const { data, error } = await supabase
            .from('work_order_items')
            .insert([itemPayload])
            .select()
            .single()

        if (error) {
            console.error('Error creating work order item:', {
                workOrderId: validated.work_order_id,
                itemType: validated.item_type,
                error: error.message,
                code: error.code,
                details: error.details
            })
            throw new Error(`Failed to create work order item: ${error.message}`)
        }

        // Validate output with Zod (use passthrough to allow extra fields from DB)
        try {
            // Use passthrough to allow extra fields that might exist in DB but not in schema
            return WorkOrderItemSchema.passthrough().parse(data)
        } catch (validationError: any) {
            // Format Zod errors for better debugging
            const errorMessages = validationError.errors?.map((err: any) => 
                `${err.path.join('.')}: ${err.message}`
            ).join(', ') || validationError.message || 'Validation failed'
            
            console.error('Validation error for created work order item:', {
                data,
                errors: validationError.errors || validationError,
                errorMessages
            })
            throw new Error(`Invalid data format returned from database: ${errorMessages}`)
        }
    }

    /**
     * Update an existing work order item
     * Note: total_price and total_cost are recalculated by database trigger
     */
    static async updateWorkOrderItem(itemId: string, itemData: Partial<WorkOrderItemFormData>): Promise<WorkOrderItem> {
        if (!itemId) {
            throw new Error('Item ID is required')
        }

        // Validate input with Zod (partial update)
        const validated = WorkOrderItemUpdateSchema.parse(itemData)

        // Build update payload (database trigger will recalculate totals)
        const updatePayload: any = {}

        if (validated.item_type !== undefined) updatePayload.item_type = validated.item_type
        if (validated.description !== undefined) updatePayload.description = validated.description.trim()
        if (validated.part_number !== undefined) updatePayload.part_number = validated.part_number?.trim() || null
        if (validated.quantity !== undefined) updatePayload.quantity = validated.quantity
        if (validated.unit_price !== undefined) updatePayload.unit_price = validated.unit_price
        // Handle unit_cost: preserve 0, convert undefined to null, keep null as null
        if (validated.unit_cost !== undefined) {
            updatePayload.unit_cost = validated.unit_cost !== null && validated.unit_cost !== undefined 
                ? validated.unit_cost 
                : null
        }
        if (validated.supplier !== undefined) updatePayload.supplier = validated.supplier?.trim() || null
        if (validated.category !== undefined) updatePayload.category = validated.category?.trim() || null
        if (validated.warranty_period !== undefined) updatePayload.warranty_period = validated.warranty_period?.trim() || null
        if (validated.notes !== undefined) updatePayload.notes = validated.notes?.trim() || null
        if (validated.labor_hours !== undefined) updatePayload.labor_hours = validated.labor_hours ?? null
        if (validated.technician_id !== undefined) updatePayload.technician_id = validated.technician_id ?? null
        if (validated.active !== undefined) updatePayload.active = validated.active

        // If no fields to update, return current item
        if (Object.keys(updatePayload).length === 0) {
            return this.getWorkOrderItem(itemId)
        }

        const { data, error } = await supabase
            .from('work_order_items')
            .update(updatePayload)
            .eq('id', itemId)
            .select()
            .single()

        if (error) {
            console.error('Error updating work order item:', {
                error,
                itemId,
                updatePayload,
                errorCode: error.code,
                errorMessage: error.message,
                errorDetails: error.details,
                errorHint: error.hint
            })
            throw new Error(`Failed to update work order item: ${error.message || 'Unknown error'}`)
        }

        // Validate output with Zod (use passthrough to allow extra fields)
        return WorkOrderItemSchema.passthrough().parse(data)
    }

    /**
     * Delete a work order item
     */
    static async deleteWorkOrderItem(itemId: string): Promise<void> {
        if (!itemId) {
            throw new Error('Item ID is required')
        }

        const { error } = await supabase
            .from('work_order_items')
            .delete()
            .eq('id', itemId)

        if (error) {
            console.error('Error deleting work order item:', error)
            throw new Error(`Failed to delete work order item: ${error.message}`)
        }
    }

    /**
     * Get summary of work order items (totals by type) - uses database function
     * Note: Requires database function 'get_work_order_items_summary' to be created
     */
    static async getWorkOrderItemsSummary(workOrderId: string): Promise<WorkOrderItemSummary> {
        if (!workOrderId) {
            throw new Error('Work Order ID is required')
        }

        try {
            const { data, error } = await supabase.rpc('get_work_order_items_summary', {
                p_work_order_id: workOrderId
            })

            if (error) {
                console.error('Error fetching work order items summary:', {
                    workOrderId,
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                })
                
                // Check if function doesn't exist
                if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
                    throw new Error('Database function not found. Please run the migration SQL scripts to create required functions.')
                }
                
                throw new Error(`Failed to fetch work order items summary: ${error.message}`)
            }

            // Validate and return
            try {
                return WorkOrderItemSummarySchema.parse(data)
            } catch (validationError) {
                console.error('Validation error for work order items summary:', {
                    workOrderId,
                    data,
                    error: validationError
                })
                throw new Error('Invalid data format returned from database')
            }
        } catch (error) {
            // Re-throw if already an Error, otherwise wrap
            if (error instanceof Error) {
                throw error
            }
            throw new Error(`Unexpected error fetching work order items summary: ${String(error)}`)
        }
    }

    /**
     * Duplicate items from one work order to another
     */
    static async duplicateWorkOrderItems(sourceWorkOrderId: string, targetWorkOrderId: string): Promise<WorkOrderItem[]> {
        const sourceItems = await this.getWorkOrderItems(sourceWorkOrderId)
        
        const duplicatedItems = await Promise.all(
            sourceItems.map(item => {
                const itemData: WorkOrderItemCreateData = {
                    work_order_id: targetWorkOrderId,
                    item_type: item.item_type,
                    description: item.description,
                    part_number: item.part_number,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    unit_cost: item.unit_cost,
                    supplier: item.supplier,
                    category: item.category,
                    warranty_period: item.warranty_period,
                    notes: item.notes,
                    labor_hours: item.labor_hours,
                    technician_id: item.technician_id,
                }
                
                return this.createWorkOrderItem(itemData)
            })
        )

        return duplicatedItems
    }

    /**
     * Mark work order item as completed
     */
    static async completeWorkOrderItem(itemId: string): Promise<WorkOrderItem> {
        const { data, error } = await supabase
            .from('work_order_items')
            .update({
                completed_at: new Date().toISOString()
            })
            .eq('id', itemId)
            .select()
            .single()

        if (error) {
            console.error('Error completing work order item:', error)
            throw new Error(`Failed to complete work order item: ${error.message}`)
        }

        // Validate output with Zod (use passthrough to allow extra fields)
        return WorkOrderItemSchema.passthrough().parse(data)
        return WorkOrderItemSchema.parse(data)
    }

    /**
     * Check if a work order item exists by ID
     */
    static async workOrderItemExists(itemId: string): Promise<boolean> {
        if (!itemId) {
            return false
        }

        try {
            await this.getWorkOrderItem(itemId)
            return true
        } catch (error) {
            return false
        }
    }

    /**
     * Bulk create items from templates (uses database function)
     * Note: Requires database function 'create_items_from_templates' to be created
     */
    static async bulkCreateFromTemplates(
        workOrderId: string,
        templateIds: string[],
        overrides?: Record<string, {
            quantity?: number
            unit_price?: number
            labor_hours?: number
            technician_id?: string
        }>
    ): Promise<Array<{ item_id: string; item_type: string }>> {
        if (!workOrderId) {
            throw new Error('Work Order ID is required')
        }

        if (!templateIds || templateIds.length === 0) {
            throw new Error('Template IDs are required')
        }

        try {
            // Convert overrides to JSONB format expected by database function
            const overridesJsonb: Record<string, any> = {}
            if (overrides) {
                Object.entries(overrides).forEach(([templateId, override]) => {
                    overridesJsonb[templateId] = override
                })
            }

            const { data, error } = await supabase.rpc('create_items_from_templates', {
                p_work_order_id: workOrderId,
                p_template_ids: templateIds,
                p_overrides: overridesJsonb
            })

            if (error) {
                console.error('Error creating items from templates:', {
                    workOrderId,
                    templateIds,
                    error: error.message,
                    code: error.code,
                    details: error.details
                })
                
                // Check if function doesn't exist
                if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
                    throw new Error('Database function not found. Please run the migration SQL scripts to create required functions.')
                }
                
                throw new Error(`Failed to create items from templates: ${error.message}`)
            }

            return data || []
        } catch (error) {
            // Re-throw if already an Error, otherwise wrap
            if (error instanceof Error) {
                throw error
            }
            throw new Error(`Unexpected error creating items from templates: ${String(error)}`)
        }
    }

    /**
     * Bulk upsert items (create new, update existing)
     * Note: Updates use database function 'bulk_update_work_order_items' if available
     * Falls back to individual updates if function doesn't exist
     */
    static async bulkUpsertItems(
        workOrderId: string,
        items: Array<{ id?: string; data: WorkOrderItemFormData }>
    ): Promise<WorkOrderItem[]> {
        if (!workOrderId) {
            throw new Error('Work Order ID is required')
        }

        if (!items || items.length === 0) {
            return []
        }

        try {
            // Separate new vs existing items
            const newItems = items.filter(item => !item.id)
            const existingItems = items.filter(item => item.id)

            const results: WorkOrderItem[] = []

            // Batch insert new items
            if (newItems.length > 0) {
            // Get shop_id from work order
            const { data: workOrder, error: workOrderError } = await supabase
                .from('work_orders')
                .select('shop_id')
                .eq('id', workOrderId)
                .single()

            if (workOrderError || !workOrder) {
                throw new Error('Work order not found')
            }

            // Validate and prepare insert payloads
            const insertPayloads = newItems.map(item => {
                const validated = WorkOrderItemCreateSchema.parse({
                    ...item.data,
                    work_order_id: workOrderId
                })

                return {
                    work_order_id: workOrderId,
                    shop_id: workOrder.shop_id,
                    item_type: validated.item_type,
                    description: validated.description.trim(),
                    part_number: validated.part_number?.trim() || null,
                    quantity: validated.quantity,
                    unit_price: validated.unit_price,
                    unit_cost: validated.unit_cost ?? null,
                    supplier: validated.supplier?.trim() || null,
                    category: validated.category?.trim() || null,
                    warranty_period: validated.warranty_period?.trim() || null,
                    notes: validated.notes?.trim() || null,
                    labor_hours: validated.labor_hours ?? null,
                    technician_id: validated.technician_id ?? null,
                }
            })

            const { data: insertedData, error: insertError } = await supabase
                .from('work_order_items')
                .insert(insertPayloads)
                .select()

            if (insertError) {
                console.error('Error bulk inserting items:', insertError)
                throw new Error(`Failed to bulk insert items: ${insertError.message}`)
            }

            // Validate and add to results
            results.push(...(insertedData || []).map(item => WorkOrderItemSchema.parse(item)))
        }

        // Batch update existing items using database function
        if (existingItems.length > 0) {
            // Prepare updates array for database function
            const updates = existingItems.map(item => {
                const validated = WorkOrderItemUpdateSchema.parse(item.data)
                
                return {
                    id: item.id!,
                    description: validated.description,
                    part_number: validated.part_number,
                    quantity: validated.quantity,
                    unit_price: validated.unit_price,
                    unit_cost: validated.unit_cost,
                    supplier: validated.supplier,
                    category: validated.category,
                    warranty_period: validated.warranty_period,
                    notes: validated.notes,
                    labor_hours: validated.labor_hours,
                    technician_id: validated.technician_id,
                    active: validated.active,
                }
            })

            const { data: updatedData, error: updateError } = await supabase.rpc(
                'bulk_update_work_order_items',
                { p_updates: updates }
            )

                if (updateError) {
                    console.error('Error bulk updating items:', {
                        workOrderId,
                        itemCount: existingItems.length,
                        error: updateError.message,
                        code: updateError.code
                    })
                    
                    // Check if function doesn't exist - fallback to individual updates
                    if (updateError.code === '42883' || updateError.message?.includes('function') || updateError.message?.includes('does not exist')) {
                        console.warn('Bulk update function not found, falling back to individual updates')
                        // Fallback to individual updates
                        for (const item of existingItems) {
                            try {
                                const validated = WorkOrderItemUpdateSchema.parse(item.data)
                                // Convert null to undefined for compatibility
                                const updateData: Partial<WorkOrderItemFormData> = {
                                    ...validated,
                                    part_number: validated.part_number ?? undefined,
                                    unit_cost: validated.unit_cost ?? undefined,
                                    supplier: validated.supplier ?? undefined,
                                    category: validated.category ?? undefined,
                                    warranty_period: validated.warranty_period ?? undefined,
                                    notes: validated.notes ?? undefined,
                                    labor_hours: validated.labor_hours ?? undefined,
                                    technician_id: validated.technician_id ?? undefined,
                                    active: validated.active ?? undefined,
                                }
                                const updated = await this.updateWorkOrderItem(item.id!, updateData)
                                results.push(updated)
                            } catch (err) {
                                console.error(`Error updating item ${item.id}:`, err)
                                throw err
                            }
                        }
                    } else {
                        throw new Error(`Failed to bulk update items: ${updateError.message}`)
                    }
                } else if (updatedData) {
                    // Validate and add to results
                    try {
                        results.push(...updatedData.map((item: any) => WorkOrderItemSchema.parse(item)))
                    } catch (validationError) {
                        console.error('Validation error for bulk updated items:', {
                            updatedData,
                            error: validationError
                        })
                        throw new Error('Invalid data format returned from bulk update')
                    }
                }
            }

            return results
        } catch (error) {
            // Re-throw if already an Error, otherwise wrap
            if (error instanceof Error) {
                throw error
            }
            throw new Error(`Unexpected error in bulk upsert: ${String(error)}`)
        }
    }
}

export const workOrderItemsService = new WorkOrderItemsService()

// Export individual functions for easier importing
export const getWorkOrderItems = WorkOrderItemsService.getWorkOrderItems
export const getWorkOrderItem = WorkOrderItemsService.getWorkOrderItem
export const createWorkOrderItem = WorkOrderItemsService.createWorkOrderItem
export const updateWorkOrderItem = WorkOrderItemsService.updateWorkOrderItem
export const deleteWorkOrderItem = WorkOrderItemsService.deleteWorkOrderItem
export const getWorkOrderItemsSummary = WorkOrderItemsService.getWorkOrderItemsSummary
