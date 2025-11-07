import { supabase } from "@/lib/supabase";
import type {
    MassCampaign,
    CampaignCreateData,
    CampaignUpdateData,
    CampaignRecipient
} from "../types/campaign";

// Re-export types for backward compatibility
export type {
    MassCampaign,
    CampaignCreateData,
    CampaignUpdateData,
    CampaignRecipient
} from "../types/campaign";

// `createCampaign(data)` - Insert into `ai_mass_campaigns`
export async function createCampaign(data: CampaignCreateData): Promise<MassCampaign> {
    const campaignData = {
        ...data,
        status: data.status || 'draft',
        total_recipients: 0,
        sent_count: 0,
        failed_count: 0,
    }

    const { data: campaign, error } = await supabase
        .from('ai_mass_campaigns')
        .insert(campaignData)
        .select()
        .single()

    if (error) throw error
    return campaign
}

// `getCampaigns(shopId)` - List all campaigns
export async function getCampaigns(shopId: string): Promise<MassCampaign[]> {
    const { data, error } = await supabase
        .from('ai_mass_campaigns')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}

// `getCampaign(id)` - Get single campaign
export async function getCampaign(id: string): Promise<MassCampaign | null> {
    const { data, error } = await supabase
        .from('ai_mass_campaigns')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
    }
    return data
}

// `updateCampaign(id, data)` - Update campaign
export async function updateCampaign(id: string, data: CampaignUpdateData): Promise<MassCampaign> {
    const { data: updatedCampaign, error } = await supabase
        .from('ai_mass_campaigns')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return updatedCampaign
}

// `previewRecipients(shopId, segmentCriteria)` - Count matching customers
export async function previewRecipients(
    shopId: string,
    segmentCriteria: Record<string, any>
): Promise<number> {
    // Import the segment builder to get customer IDs
    const { buildSegmentQuery } = await import('./customer-segment-builder')
    
    // Get matching customer IDs
    const customerIds = await buildSegmentQuery(shopId, segmentCriteria)
    
    return customerIds.length
}

// `generateRecipients(campaignId)` - Create `ai_mass_campaign_recipients` entries
export async function generateRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    // Get the campaign to access segment_criteria
    const campaign = await getCampaign(campaignId)
    if (!campaign) {
        throw new Error('Campaign not found')
    }

    // Import the segment builder to get customer IDs
    const { buildSegmentQuery } = await import('./customer-segment-builder')
    
    // Get matching customer IDs
    const customerIds = await buildSegmentQuery(campaign.shop_id, campaign.segment_criteria)
    
    if (customerIds.length === 0) {
        return []
    }

    // Get customer phone numbers
    const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, customer_phone')
        .in('id', customerIds)

    if (customersError) throw customersError
    if (!customers || customers.length === 0) {
        return []
    }

    // Create recipient entries
    const recipients = customers.map((customer: { id: string; customer_phone: string }) => ({
        campaign_id: campaignId,
        customer_id: customer.id,
        phone_number: customer.customer_phone,
        status: 'pending' as const,
    }))

    const { data: createdRecipients, error } = await supabase
        .from('ai_mass_campaign_recipients')
        .insert(recipients)
        .select()

    if (error) throw error

    // Update campaign with total recipients count
    await updateCampaign(campaignId, {
        total_recipients: createdRecipients?.length || 0,
    })

    return createdRecipients || []
}

// `getCampaignRecipients(campaignId)` - Get all recipients with status
export async function getCampaignRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    const { data, error } = await supabase
        .from('ai_mass_campaign_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
}

