import { createClient } from "@/utils/supabase/server";
import type {
    MessageTemplate,
    MessageTemplateCreateData,
    MessageTemplateUpdateData,
    TriggerType,
    ServiceType
} from "../types/message-template";

// Re-export types for backward compatibility
export type {
    MessageTemplate,
    MessageTemplateCreateData,
    MessageTemplateUpdateData
} from "../types/message-template";

// `createTemplate(data)` - Insert into `ai_message_templates`
export async function createTemplate(data: MessageTemplateCreateData): Promise<MessageTemplate> {
    const supabase = await createClient();
    
    const insertData: any = {
        shop_id: data.shop_id,
        name: data.name,
        trigger_type: data.trigger_type,
        service_type: data.service_type ?? null,
        message_template: data.message_template,
        variables: data.variables ?? [],
        delay_hours: data.delay_hours ?? 0, // Default to immediate
        is_active: data.is_active ?? true
    }
    
    const { data: createdTemplate, error } = await supabase
        .from('ai_message_templates')
        .insert(insertData)
        .select()
        .single()
    
    if (error) {
        console.error('Supabase insert error:', error)
        throw error
    }
    return createdTemplate
}

// `getTemplates(shopId)` - Get all templates for shop
export async function getTemplates(shopId: string): Promise<MessageTemplate[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('ai_message_templates')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
}

// `getTemplate(id)` - Get single template
export async function getTemplate(id: string): Promise<MessageTemplate | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('ai_message_templates')
        .select('*')
        .eq('id', id)
        .single()
    
    if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
    }
    return data
}

// `updateTemplate(id, data)` - Update template
export async function updateTemplate(id: string, data: MessageTemplateUpdateData): Promise<MessageTemplate> {
    const supabase = await createClient();
    
    const { data: updatedTemplate, error } = await supabase
        .from('ai_message_templates')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    
    if (error) throw error
    return updatedTemplate
}

// `deleteTemplate(id)` - Delete template
export async function deleteTemplate(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('ai_message_templates')
        .delete()
        .eq('id', id)
    
    if (error) throw error
}

// `getActiveTemplates(shopId)` - Get active templates for a shop
export async function getActiveTemplates(shopId: string): Promise<MessageTemplate[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('ai_message_templates')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
}

// `getActiveTemplatesByTrigger(shopId, triggerType)` - Get active templates by trigger type
export async function getActiveTemplatesByTrigger(
    shopId: string, 
    triggerType: TriggerType,
    serviceType?: ServiceType
): Promise<MessageTemplate[]> {
    const supabase = await createClient();
    
    let query = supabase
        .from('ai_message_templates')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .eq('trigger_type', triggerType)
    
    // If service type is provided, filter by it OR templates that apply to all services (null)
    if (serviceType) {
        query = query.or(`service_type.eq.${serviceType},service_type.is.null`)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
}

// `getTemplatesByTriggerType(shopId, triggerType)` - Get all templates by trigger type (including inactive)
export async function getTemplatesByTriggerType(
    shopId: string, 
    triggerType: TriggerType
): Promise<MessageTemplate[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('ai_message_templates')
        .select('*')
        .eq('shop_id', shopId)
        .eq('trigger_type', triggerType)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
}
