import { createClient } from "@/utils/supabase/server";
import type {
    MassCampaign,
    MassCampaignCreateData,
    MassCampaignUpdateData,
    CampaignRecipient,
    CampaignRecipientCreateData,
    CampaignWithDetails,
    CampaignStats,
    CustomerSegment,
    SegmentPreview
} from "../types/mass-campaign";

// Re-export types for backward compatibility
export type {
    MassCampaign,
    MassCampaignCreateData,
    MassCampaignUpdateData,
    CampaignRecipient,
    CampaignRecipientCreateData
} from "../types/mass-campaign";

// ============================================
// CAMPAIGN CRUD OPERATIONS
// ============================================

// Create a new campaign
export async function createCampaign(data: MassCampaignCreateData): Promise<MassCampaign> {
    const supabase = await createClient();
    
    const insertData = {
        shop_id: data.shop_id,
        name: data.name,
        message: data.message,
        customer_segment: data.customer_segment ?? {},
        scheduled_send_at: data.scheduled_send_at ?? null,
        status: data.status ?? 'draft',
        total_recipients: 0,
        sent_count: 0,
        failed_count: 0,
        created_by: data.created_by ?? null
    }
    
    const { data: campaign, error } = await supabase
        .from('ai_mass_campaigns')
        .insert(insertData)
        .select()
        .single()
    
    if (error) {
        console.error('Error creating campaign:', error)
        throw error
    }
    
    return campaign
}

// Get all campaigns for a shop
export async function getCampaigns(shopId: string): Promise<MassCampaign[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('ai_mass_campaigns')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
}

// Get a single campaign by ID
export async function getCampaign(campaignId: string): Promise<MassCampaign | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('ai_mass_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()
    
    if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
    }
    
    return data
}

// Update a campaign
export async function updateCampaign(
    campaignId: string, 
    data: MassCampaignUpdateData
): Promise<MassCampaign> {
    const supabase = await createClient();
    
    const { data: updated, error } = await supabase
        .from('ai_mass_campaigns')
        .update(data)
        .eq('id', campaignId)
        .select()
        .single()
    
    if (error) throw error
    return updated
}

// Delete a campaign
export async function deleteCampaign(campaignId: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
        .from('ai_mass_campaigns')
        .delete()
        .eq('id', campaignId)
    
    if (error) throw error
}

// Get campaigns by status
export async function getCampaignsByStatus(
    shopId: string, 
    status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
): Promise<MassCampaign[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('ai_mass_campaigns')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', status)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
}

// Get campaign statistics
export async function getCampaignStats(shopId: string): Promise<CampaignStats> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('ai_mass_campaigns')
        .select('status')
        .eq('shop_id', shopId)
    
    if (error) throw error
    
    const stats: CampaignStats = {
        total: data?.length || 0,
        draft: 0,
        scheduled: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
    }
    
    data?.forEach(campaign => {
        if (campaign.status) {
            stats[campaign.status as keyof Omit<CampaignStats, 'total'>]++
        }
    })
    
    return stats
}

// ============================================
// RECIPIENT OPERATIONS
// ============================================

// Add recipients to a campaign
export async function addRecipients(
    recipients: CampaignRecipientCreateData[]
): Promise<CampaignRecipient[]> {
    const supabase = await createClient();
    
    const insertData = recipients.map(r => ({
        campaign_id: r.campaign_id,
        customer_id: r.customer_id,
        customer_phone: r.customer_phone,
        status: r.status ?? 'pending'
    }))
    
    const { data, error } = await supabase
        .from('ai_mass_campaign_recipients')
        .insert(insertData)
        .select()
    
    if (error) {
        console.error('Error adding recipients:', error)
        throw error
    }
    
    return data || []
}

// Get recipients for a campaign
export async function getCampaignRecipients(
    campaignId: string,
    status?: 'pending' | 'sent' | 'failed'
): Promise<CampaignRecipient[]> {
    const supabase = await createClient();
    
    let query = supabase
        .from('ai_mass_campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
    
    if (status) {
        query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
}

// Update recipient status after sending
export async function updateRecipientStatus(
    recipientId: string,
    status: 'sent' | 'failed',
    smsMessageId?: string,
    errorMessage?: string
): Promise<CampaignRecipient> {
    const supabase = await createClient();
    
    const updateData: any = {
        status,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        error_message: errorMessage ?? null,
        sms_message_id: smsMessageId ?? null
    }
    
    const { data, error } = await supabase
        .from('ai_mass_campaign_recipients')
        .update(updateData)
        .eq('id', recipientId)
        .select()
        .single()
    
    if (error) throw error
    return data
}

// Update campaign counts after sending
export async function updateCampaignCounts(campaignId: string): Promise<void> {
    const supabase = await createClient();
    
    // Get recipient counts
    const { data: recipients, error } = await supabase
        .from('ai_mass_campaign_recipients')
        .select('status')
        .eq('campaign_id', campaignId)
    
    if (error) throw error
    
    const sentCount = recipients?.filter(r => r.status === 'sent').length || 0
    const failedCount = recipients?.filter(r => r.status === 'failed').length || 0
    const totalRecipients = recipients?.length || 0
    
    // Update campaign
    await supabase
        .from('ai_mass_campaigns')
        .update({
            sent_count: sentCount,
            failed_count: failedCount,
            total_recipients: totalRecipients
        })
        .eq('id', campaignId)
}

// ============================================
// CUSTOMER SEGMENTATION (Foundation)
// ============================================

// Preview customer segment (returns count and sample)
export async function previewSegment(
    shopId: string,
    segment: CustomerSegment
): Promise<SegmentPreview> {
    const supabase = await createClient();
    
    // Start with base query
    let query = supabase
        .from('customers')
        .select('id, customer_name, customer_phone, customer_email')
        .eq('shop_id', shopId)
        .not('customer_phone', 'is', null) // Only customers with phone numbers
    
    // Apply filters based on segment
    // This is a foundation - can be expanded with more complex filters
    
    if (segment.customer_tags && segment.customer_tags.length > 0) {
        // Filter by tags (assuming tags is a JSONB array column)
        query = query.overlaps('tags', segment.customer_tags)
    }
    
    if (segment.include_customer_ids && segment.include_customer_ids.length > 0) {
        query = query.in('id', segment.include_customer_ids)
    }
    
    if (segment.exclude_customer_ids && segment.exclude_customer_ids.length > 0) {
        query = query.not('id', 'in', `(${segment.exclude_customer_ids.join(',')})`)
    }
    
    // Get count
    const { count, error: countError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .not('customer_phone', 'is', null)
    
    if (countError) throw countError
    
    // Get sample (first 10)
    const { data: sample, error: sampleError } = await query.limit(10)
    
    if (sampleError) throw sampleError
    
    return {
        count: count || 0,
        sample_customers: sample || []
    }
}

