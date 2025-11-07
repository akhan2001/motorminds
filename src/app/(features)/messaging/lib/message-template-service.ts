import { supabase } from "@/lib/supabase";
import type {
    MessageTemplate,
    MessageTemplateCreateData,
    MessageTemplateUpdateData
} from "../types/message-template";

// Re-export types for backward compatibility
export type {
    MessageTemplate,
    MessageTemplateCreateData,
    MessageTemplateUpdateData
} from "../types/message-template";

// `createTemplate(data)` - Insert into `ai_message_templates`
export async function createTemplate(data: MessageTemplateCreateData): Promise<MessageTemplate> {
    const { data: createdTemplate, error } = await supabase
        .from('ai_message_templates')
        .insert(data)
        .select()
        .single()
    
    if (error) throw error
    return createdTemplate
}

// `getTemplates(shopId)` - Get all templates for shop
export async function getTemplates(shopId: string): Promise<MessageTemplate[]> {
    const { data, error } = await supabase
        .from('ai_message_templates')
        .select('*')
        .eq('shop_id', shopId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
}

// `getTemplate(id)` - Get single template
export async function getTemplate(id: string): Promise<MessageTemplate | null> {
    const { data, error } = await supabase
        .from('ai_message_templates')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()
    
    if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
    }
    return data
}

// `updateTemplate(id, data)` - Update template
export async function updateTemplate(id: string, data: MessageTemplateUpdateData): Promise<MessageTemplate> {
    const { data: updatedTemplate, error } = await supabase
        .from('ai_message_templates')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    
    if (error) throw error
    return updatedTemplate
}

// `deleteTemplate(id)` - Soft delete or hard delete
export async function deleteTemplate(id: string, hardDelete: boolean = false): Promise<void> {
    if (hardDelete) {
        const { error } = await supabase
            .from('ai_message_templates')
            .delete()
            .eq('id', id)
        
        if (error) throw error
    } else {
        // Soft delete
        const { error } = await supabase
            .from('ai_message_templates')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
        
        if (error) throw error
    }
}

// `getTemplatesByTrigger(shopId, triggerType)` - Get active templates for a trigger
export async function getTemplatesByTrigger(shopId: string, triggerType: string): Promise<MessageTemplate[]> {
    const { data, error } = await supabase
        .from('ai_message_templates')
        .select('*')
        .eq('shop_id', shopId)
        .eq('trigger_type', triggerType)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
}