import { createClient } from '@/utils/supabase/client'
import type { 
    WorkOrderItemTemplate, 
    WorkOrderItemTemplateCreateData, 
    WorkOrderItemTemplateUpdateData,
    CloneTemplateToWorkOrderData 
} from '../types/work-order-item-templates'

export class WorkOrderItemTemplatesService {
    private static supabase = createClient()

    /**
     * Get all templates for a shop
     */
    static async getTemplatesByShopId(shopId: string): Promise<WorkOrderItemTemplate[]> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        const { data, error } = await this.supabase
            .from('work_order_item_templates')
            .select('*')
            .eq('shop_id', shopId)
            .order('category', { ascending: true })
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching work order item templates:', error)
            throw new Error(`Failed to fetch templates: ${error.message}`)
        }

        return data || []
    }

    /**
     * Get templates by category
     */
    static async getTemplatesByCategory(shopId: string, category: string): Promise<WorkOrderItemTemplate[]> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        const { data, error } = await this.supabase
            .from('work_order_item_templates')
            .select('*')
            .eq('shop_id', shopId)
            .eq('category', category)
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching templates by category:', error)
            throw new Error(`Failed to fetch templates: ${error.message}`)
        }

        return data || []
    }

    /**
     * Get a single template by ID
     */
    static async getTemplate(templateId: string): Promise<WorkOrderItemTemplate | null> {
        if (!templateId) {
            throw new Error('Template ID is required')
        }

        const { data, error } = await this.supabase
            .from('work_order_item_templates')
            .select('*')
            .eq('id', templateId)
            .single()

        if (error) {
            console.error('Error fetching template:', error)
            throw new Error(`Failed to fetch template: ${error.message}`)
        }

        return data
    }

    /**
     * Create a new template
     */
    static async createTemplate(templateData: WorkOrderItemTemplateCreateData): Promise<WorkOrderItemTemplate> {
        const { data, error } = await this.supabase
            .from('work_order_item_templates')
            .insert(templateData)
            .select()
            .single()

        if (error) {
            console.error('Error creating template:', error)
            throw new Error(`Failed to create template: ${error.message}`)
        }

        return data
    }

    /**
     * Update an existing template
     */
    static async updateTemplate(templateId: string, updateData: WorkOrderItemTemplateUpdateData): Promise<WorkOrderItemTemplate> {
        const { data, error } = await this.supabase
            .from('work_order_item_templates')
            .update(updateData)
            .eq('id', templateId)
            .select()
            .single()

        if (error) {
            console.error('Error updating template:', error)
            throw new Error(`Failed to update template: ${error.message}`)
        }

        return data
    }

    /**
     * Delete a template
     */
    static async deleteTemplate(templateId: string): Promise<void> {
        const { error } = await this.supabase
            .from('work_order_item_templates')
            .delete()
            .eq('id', templateId)

        if (error) {
            console.error('Error deleting template:', error)
            throw new Error(`Failed to delete template: ${error.message}`)
        }
    }

    /**
     * Clone a template to a work order (creates a new work order item)
     */
    static async cloneTemplateToWorkOrder(cloneData: CloneTemplateToWorkOrderData): Promise<any> {
        // First, get the template
        const template = await this.getTemplate(cloneData.template_id)
        if (!template) {
            throw new Error('Template not found')
        }

        // Calculate total price
        const totalPrice = (cloneData.quantity || template.quantity) * (cloneData.unit_price || template.unit_price)

        // Prepare the work order item data
        const workOrderItemData = {
            work_order_id: cloneData.work_order_id,
            shop_id: template.shop_id,
            item_type: template.item_type,
            description: template.name, // Use template name as description
            quantity: cloneData.quantity || template.quantity,
            unit_price: cloneData.unit_price || template.unit_price,
            total_price: totalPrice,
            unit_cost: template.unit_cost,
            total_cost: template.unit_cost ? (cloneData.quantity || template.quantity) * template.unit_cost : null,
            labor_hours: cloneData.labor_hours || template.labor_hours,
            part_number: template.part_number,
            supplier: template.supplier,
            category: template.category,
            notes: cloneData.notes || template.description,
            warranty_period: template.warranty_period,
            technician_id: cloneData.technician_id,
            active: true
        }

        // Insert the new work order item
        const { data, error } = await this.supabase
            .from('work_order_items')
            .insert(workOrderItemData)
            .select()
            .single()

        if (error) {
            console.error('Error cloning template to work order:', error)
            throw new Error(`Failed to clone template: ${error.message}`)
        }

        return data
    }

    /**
     * Search templates by item type and description
     */
    static async searchTemplates(
        shopId: string, 
        itemType: string, 
        searchTerm: string, 
        limit: number = 10
    ): Promise<WorkOrderItemTemplate[]> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        if (!searchTerm || searchTerm.length < 2) {
            return []
        }

        const { data, error } = await this.supabase
            .from('work_order_item_templates')
            .select('*')
            .eq('shop_id', shopId)
            .eq('item_type', itemType)
            .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
            .order('name', { ascending: true })
            .limit(limit)

        if (error) {
            console.error('Error searching templates:', error)
            throw new Error(`Failed to search templates: ${error.message}`)
        }

        return data || []
    }

    /**
     * Get all unique categories for a shop
     */
    static async getCategoriesByShopId(shopId: string): Promise<string[]> {
        if (!shopId) {
            throw new Error('Shop ID is required')
        }

        const { data, error } = await this.supabase
            .from('work_order_item_templates')
            .select('category')
            .eq('shop_id', shopId)
            .not('category', 'is', null)

        if (error) {
            console.error('Error fetching categories:', error)
            throw new Error(`Failed to fetch categories: ${error.message}`)
        }

        // Extract unique categories
        const categories = [...new Set(data?.map(item => item.category).filter(Boolean))]
        return categories.sort()
    }
}
