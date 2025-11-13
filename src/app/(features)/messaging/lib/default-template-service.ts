import { createClient } from "@/utils/supabase/server";
import { TIME_PERIODS } from "../types/message-template";
import type { MessageTemplate } from "../types/message-template";

/**
 * Default Template Service
 * Creates and manages default message templates for shops
 */

// Default 1-month check-up template
const DEFAULT_TEMPLATE = {
    name: "1 Month Check-up Reminder",
    trigger_type: "work_order_complete" as const,
    service_type: null, // Applies to all service types
    message_template: `Hi {{customer_name}},

It's been about a month since we serviced your {{vehicle_make}} {{vehicle_model}}. We hope everything is running smoothly!

This is a friendly reminder to schedule your next service appointment if needed. Regular maintenance keeps your vehicle in top condition.

Reply or call us at {{shop_phone}} to schedule.

Thank you for choosing {{shop_name}}!`,
    delay_hours: TIME_PERIODS.ONE_MONTH, // 720 hours = ~30 days
    is_active: true
};

/**
 * Check if shop has the default template
 */
export async function hasDefaultTemplate(shopId: string): Promise<boolean> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('ai_message_templates')
        .select('id')
        .eq('shop_id', shopId)
        .eq('name', DEFAULT_TEMPLATE.name)
        .eq('trigger_type', 'work_order_complete')
        .limit(1);
    
    if (error) {
        console.error('Error checking for default template:', error);
        return false;
    }
    
    return (data && data.length > 0);
}

/**
 * Create the default template for a shop
 */
export async function createDefaultTemplate(shopId: string): Promise<MessageTemplate> {
    const supabase = await createClient();
    
    const insertData = {
        shop_id: shopId,
        ...DEFAULT_TEMPLATE,
        variables: [] // Auto-populated by variable replacer
    };
    
    const { data: template, error } = await supabase
        .from('ai_message_templates')
        .insert(insertData)
        .select()
        .single();
    
    if (error) {
        console.error('Error creating default template:', error);
        throw new Error(`Failed to create default template: ${error.message}`);
    }
    
    console.log('✅ Default template created for shop:', shopId);
    return template;
}

/**
 * Initialize default template for a shop (idempotent)
 * Only creates if it doesn't already exist
 */
export async function initializeDefaultTemplate(shopId: string): Promise<MessageTemplate | null> {
    // Check if template already exists
    const exists = await hasDefaultTemplate(shopId);
    
    if (exists) {
        console.log('✅ Default template already exists for shop:', shopId);
        return null;
    }
    
    // Create the template
    return await createDefaultTemplate(shopId);
}

/**
 * Initialize default templates for all shops that don't have them
 * Useful for batch initialization or migrations
 */
export async function initializeAllShopsDefaultTemplates(): Promise<{
    success: number;
    failed: number;
    errors: Array<{ shopId: string; error: string }>;
}> {
    const supabase = await createClient();
    
    // Get all shops
    const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, shop_name');
    
    if (shopsError) {
        throw new Error(`Failed to fetch shops: ${shopsError.message}`);
    }
    
    const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ shopId: string; error: string }>
    };
    
    for (const shop of shops || []) {
        try {
            await initializeDefaultTemplate(shop.id);
            results.success++;
        } catch (error: any) {
            results.failed++;
            results.errors.push({
                shopId: shop.id,
                error: error.message || 'Unknown error'
            });
            console.error(`Failed to initialize template for shop ${shop.id}:`, error);
        }
    }
    
    console.log(`✅ Initialized default templates: ${results.success} success, ${results.failed} failed`);
    return results;
}

/**
 * Get the default template for a shop (if it exists)
 */
export async function getDefaultTemplate(shopId: string): Promise<MessageTemplate | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('ai_message_templates')
        .select('*')
        .eq('shop_id', shopId)
        .eq('name', DEFAULT_TEMPLATE.name)
        .eq('trigger_type', 'work_order_complete')
        .single();
    
    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error fetching default template:', error);
        throw error;
    }
    
    return data;
}

