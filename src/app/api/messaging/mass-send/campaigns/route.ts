import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import {
    getCampaigns,
    createCampaign
} from "@/app/(features)/messaging/lib/campaign-service";
import type { CampaignCreateData } from "@/app/(features)/messaging/types/campaign";

// GET - List all campaigns for shop
export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Get campaigns for shop
        let campaigns = await getCampaigns(shopId);

        // Apply optional status filter
        if (status) {
            campaigns = campaigns.filter(c => c.status === status);
        }

        return NextResponse.json(campaigns);

    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            description,
            template_id,
            scheduled_send_at,
            segment_criteria
        } = body;

        // Validate required fields
        if (!name || !template_id || !segment_criteria) {
            return NextResponse.json(
                { error: 'Missing required fields: name, template_id, segment_criteria' },
                { status: 400 }
            );
        }

        // Create campaign data
        const campaignData: CampaignCreateData = {
            shop_id: shopId,
            name,
            description: description || null,
            template_id,
            scheduled_send_at: scheduled_send_at || null,
            segment_criteria,
            status: scheduled_send_at ? 'scheduled' : 'draft'
        };

        const campaign = await createCampaign(campaignData);

        return NextResponse.json(campaign, { status: 201 });

    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

