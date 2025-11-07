import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { getCampaign, getCampaignRecipients } from "@/app/(features)/messaging/lib/campaign-service";
import { createClient } from "@/utils/supabase/server";

// GET - List all recipients with status
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify campaign exists and belongs to shop
        const campaign = await getCampaign(params.id);
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        if (campaign.shop_id !== shopId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '100');

        // Get recipients
        let recipients = await getCampaignRecipients(params.id);

        // Apply status filter if provided
        if (status) {
            recipients = recipients.filter(r => r.status === status);
        }

        // Apply limit
        recipients = recipients.slice(0, limit);

        // Get customer details for recipients
        const supabase = await createClient();
        const customerIds = recipients.map(r => r.customer_id);
        
        const { data: customers } = await supabase
            .from('customers')
            .select('id, customer_name, customer_phone, customer_email')
            .in('id', customerIds);

        // Map customer data to recipients
        const recipientsWithDetails = recipients.map(recipient => {
            const customer = customers?.find(c => c.id === recipient.customer_id);
            return {
                ...recipient,
                customer_name: customer?.customer_name || null,
                customer_email: customer?.customer_email || null
            };
        });

        return NextResponse.json({
            recipients: recipientsWithDetails,
            total: recipients.length,
            status_counts: {
                pending: recipients.filter(r => r.status === 'pending').length,
                sent: recipients.filter(r => r.status === 'sent').length,
                failed: recipients.filter(r => r.status === 'failed').length
            }
        });

    } catch (error) {
        console.error('Error fetching campaign recipients:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

