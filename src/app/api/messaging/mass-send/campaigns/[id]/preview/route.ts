import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { previewRecipients } from "@/app/(features)/messaging/lib/campaign-service";
import { buildSegmentQuery } from "@/app/(features)/messaging/lib/customer-segment-builder";
import { createClient } from "@/utils/supabase/server";
import type { SegmentCriteria } from "@/app/(features)/messaging/types/segment";

// POST - Preview recipient count and sample customers
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { customer_segment } = body;

        // Use provided segment criteria or get from campaign
        let segmentCriteria: SegmentCriteria;

        if (customer_segment) {
            segmentCriteria = customer_segment;
        } else {
            // Get campaign to use its segment criteria
            const supabase = await createClient();
            const { data: campaign, error: campaignError } = await supabase
                .from('ai_mass_campaigns')
                .select('segment_criteria, shop_id')
                .eq('id', params.id)
                .single();

            if (campaignError || !campaign) {
                return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
            }

            if (campaign.shop_id !== shopId) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            segmentCriteria = campaign.segment_criteria as SegmentCriteria;
        }

        // Get matching customer IDs
        const customerIds = await buildSegmentQuery(shopId, segmentCriteria);

        // Get sample customers (first 10) with details
        const supabase = await createClient();
        const { data: sampleCustomers, error: sampleError } = await supabase
            .from('customers')
            .select('id, customer_name, customer_phone, customer_email, tags')
            .in('id', customerIds.slice(0, 10))
            .limit(10);

        if (sampleError) {
            console.error('Error fetching sample customers:', sampleError);
        }

        return NextResponse.json({
            count: customerIds.length,
            sample_customers: sampleCustomers || []
        });

    } catch (error) {
        console.error('Error previewing recipients:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

