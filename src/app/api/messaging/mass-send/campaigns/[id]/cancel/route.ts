import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { getCampaign, updateCampaign, getCampaignRecipients } from "@/app/(features)/messaging/lib/campaign-service";
import { createClient } from "@/utils/supabase/server";

// POST - Cancel in-progress campaign
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get campaign
        const campaign = await getCampaign(params.id);
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        if (campaign.shop_id !== shopId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Only allow cancelling campaigns that are sending or scheduled
        if (campaign.status !== 'sending' && campaign.status !== 'scheduled') {
            return NextResponse.json(
                { error: `Cannot cancel campaign with status: ${campaign.status}` },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Update campaign status to 'cancelled'
        await updateCampaign(params.id, {
            status: 'cancelled'
        });

        // 2. Get pending recipients
        const recipients = await getCampaignRecipients(params.id);
        const pendingRecipients = recipients.filter(r => r.status === 'pending');

        // 3. Cancel pending queue items (mark as cancelled in ai_message_queue)
        if (pendingRecipients.length > 0) {
            // Get queue items for this campaign's recipients
            // Note: We need to match by customer_id and phone_number since queue items
            // don't have a direct campaign_id reference
            const customerIds = pendingRecipients.map(r => r.customer_id);
            const phoneNumbers = pendingRecipients.map(r => r.phone_number);

            // Update queue items to cancelled status
            // This is a best-effort cancellation since queue items might already be processing
            const { data: queueItems } = await supabase
                .from('ai_message_queue')
                .select('id')
                .eq('shop_id', shopId)
                .eq('status', 'pending')
                .in('customer_id', customerIds);

            if (queueItems && queueItems.length > 0) {
                const queueIds = queueItems.map(q => q.id);
                await supabase
                    .from('ai_message_queue')
                    .update({
                        status: 'cancelled',
                        updated_at: new Date().toISOString()
                    })
                    .in('id', queueIds);
            }
        }

        // 4. Update pending recipients to failed status
        if (pendingRecipients.length > 0) {
            const pendingIds = pendingRecipients.map(r => r.id);
            await supabase
                .from('ai_mass_campaign_recipients')
                .update({
                    status: 'failed',
                    error_message: 'Campaign cancelled',
                    updated_at: new Date().toISOString()
                })
                .in('id', pendingIds);
        }

        // Get updated counts
        const updatedRecipients = await getCampaignRecipients(params.id);
        const sentCount = updatedRecipients.filter(r => r.status === 'sent').length;
        const failedCount = updatedRecipients.filter(r => r.status === 'failed').length;

        // Update campaign with final counts
        await updateCampaign(params.id, {
            sent_count: sentCount,
            failed_count: failedCount
        });

        return NextResponse.json({
            success: true,
            message: 'Campaign cancelled successfully',
            cancelled_recipients: pendingRecipients.length,
            sent_count: sentCount,
            failed_count: failedCount
        });

    } catch (error) {
        console.error('Error cancelling campaign:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

