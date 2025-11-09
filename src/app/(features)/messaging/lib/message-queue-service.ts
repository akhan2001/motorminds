import { createClient } from "@/utils/supabase/server";
import type {
    MessageQueueItem,
    MessageQueueCreateData,
    MessageQueueWithDetails
} from "../types/message-queue";

// Re-export types for backward compatibility
export type {
    MessageQueueItem,
    MessageQueueCreateData,
    MessageQueueWithDetails
} from "../types/message-queue";

// `addToQueue(data)` - Insert into `ai_message_queue`
export async function addToQueue(data: MessageQueueCreateData): Promise<MessageQueueItem> {
    const supabase = await createClient();
    const queueData = {
        shop_id: data.shop_id,
        template_id: data.template_id ?? null,
        customer_id: data.customer_id,
        trigger_event: data.trigger_event,
        trigger_data: data.trigger_data ?? {},
        status: data.status || 'pending',
        scheduled_send_at: data.scheduled_send_at || new Date().toISOString(),
        retry_count: data.retry_count || 0,
    }

    const { data: queueItem, error } = await supabase
        .from('ai_message_queue')
        .insert(queueData)
        .select()
        .single()

    if (error) {
        console.error('Error adding to queue:', error)
        throw error
    }
    return queueItem
}

// `getPendingMessages(shopId)` - Get messages ready to send (`scheduled_send_at <= now()`)
export async function getPendingMessages(shopId: string): Promise<MessageQueueItem[]> {
    const supabase = await createClient();
    const now = new Date().toISOString()

    const { data, error } = await supabase
        .from('ai_message_queue')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', 'pending')
        .lte('scheduled_send_at', now)
        .order('scheduled_send_at', { ascending: true })

    if (error) throw error
    return data || []
}

// `markAsSent(queueId, smsMessageId)` - Update status and link to `sms_messages`
export async function markAsSent(queueId: string, smsMessageId: string): Promise<MessageQueueItem> {
    const supabase = await createClient();
    const { data: updatedItem, error } = await supabase
        .from('ai_message_queue')
        .update({
            status: 'sent',
            sms_message_id: smsMessageId,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', queueId)
        .select()
        .single()

    if (error) throw error
    return updatedItem
}

// `markAsFailed(queueId, error)` - Update with error
export async function markAsFailed(queueId: string, errorMessage: string): Promise<MessageQueueItem> {
    const supabase = await createClient();
    const { data: updatedItem, error } = await supabase
        .from('ai_message_queue')
        .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString()
        })
        .eq('id', queueId)
        .select()
        .single()

    if (error) throw error
    return updatedItem
}

// `retryMessage(queueId)` - Increment retry count and reset status
export async function retryMessage(queueId: string): Promise<MessageQueueItem> {
    const supabase = await createClient();
    // First get the current item to increment retry_count
    const { data: currentItem, error: fetchError } = await supabase
        .from('ai_message_queue')
        .select('retry_count')
        .eq('id', queueId)
        .single()

    if (fetchError) throw fetchError
    if (!currentItem) throw new Error('Queue item not found')

    const { data: updatedItem, error } = await supabase
        .from('ai_message_queue')
        .update({
            status: 'pending',
            retry_count: (currentItem.retry_count || 0) + 1,
            error_message: null
        })
        .eq('id', queueId)
        .select()
        .single()

    if (error) throw error
    return updatedItem
}

// `getQueueItems(shopId, status?)` - Get queue items with optional status filter
export async function getQueueItems(
    shopId: string, 
    status?: 'pending' | 'sent' | 'failed'
): Promise<MessageQueueItem[]> {
    const supabase = await createClient();
    
    let query = supabase
        .from('ai_message_queue')
        .select('*')
        .eq('shop_id', shopId)
        .order('scheduled_send_at', { ascending: false })
    
    if (status) {
        query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
}

// `getQueueItemsWithDetails(shopId, status?)` - Get queue items with customer and template details
export async function getQueueItemsWithDetails(
    shopId: string,
    status?: 'pending' | 'sent' | 'failed'
): Promise<MessageQueueWithDetails[]> {
    const supabase = await createClient();
    
    let query = supabase
        .from('ai_message_queue')
        .select(`
            *,
            customer:customers(id, customer_name, customer_phone, customer_email),
            template:ai_message_templates(id, name, trigger_type)
        `)
        .eq('shop_id', shopId)
        .order('scheduled_send_at', { ascending: false })
    
    if (status) {
        query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data as MessageQueueWithDetails[] || []
}

// `deleteQueueItem(queueId)` - Delete a queue item
export async function deleteQueueItem(queueId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('ai_message_queue')
        .delete()
        .eq('id', queueId)
    
    if (error) throw error
}
