import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { getCampaigns, createCampaign, getCampaignStats } from "@/app/(features)/messaging/lib/mass-campaign-service";
import type { MassCampaignCreateData } from "@/app/(features)/messaging/types/mass-campaign";

import { MESSAGING_LIMITS } from "@/app/(features)/messaging/lib/limits";

// GET - List all campaigns for shop (with optional stats)
export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includeStats = searchParams.get('include_stats') === 'true';

        const campaigns = await getCampaigns(shopId);

        if (includeStats) {
            const stats = await getCampaignStats(shopId);
            return NextResponse.json({ campaigns, stats });
        }

        return NextResponse.json(campaigns);

    } catch (error: any) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch campaigns', details: error.message },
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

        // Check template count limit
        const existingCampaigns = await getCampaigns(shopId);
        if (existingCampaigns.length >= MESSAGING_LIMITS.MAX_CAMPAIGNS) {
            return NextResponse.json({
                error: `Maximum limit reached`,
                message: `Only ${MESSAGING_LIMITS.MAX_CAMPAIGNS} campaigns can be created for now. More campaigns can be added in the future.`,
                limit: MESSAGING_LIMITS.MAX_CAMPAIGNS,
                current: existingCampaigns.length,
            }, { status: 403 });
        }


        const body: MassCampaignCreateData = await request.json();
        const { name, message, customer_segment, scheduled_send_at, status } = body;

        // Validate required fields
        if (!name || !message) {
            return NextResponse.json({
                error: 'Missing required fields',
                missing: {
                    name: !name,
                    message: !message
                }
            }, { status: 400 });
        }

        // Create campaign
        const campaignData: MassCampaignCreateData = {
            shop_id: shopId,
            name: name.trim(),
            message: message.trim(),
            customer_segment: customer_segment ?? {},
            scheduled_send_at: scheduled_send_at ?? null,
            status: status ?? 'draft'
        };

        const createdCampaign = await createCampaign(campaignData);

        return NextResponse.json({
            success: true,
            campaign: createdCampaign
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating campaign:', error);
        return NextResponse.json(
            {
                error: 'Failed to create campaign',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}

