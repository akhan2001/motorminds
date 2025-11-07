import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import {
    getCampaign,
    updateCampaign
} from "@/app/(features)/messaging/lib/campaign-service";
import type { CampaignUpdateData } from "@/app/(features)/messaging/types/campaign";
import { createClient } from "@/utils/supabase/server";

// GET - Get single campaign
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const campaign = await getCampaign(params.id);

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // Verify shop ownership
        if (campaign.shop_id !== shopId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(campaign);

    } catch (error) {
        console.error('Error fetching campaign:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// PUT - Update campaign
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify campaign exists and belongs to shop
        const existingCampaign = await getCampaign(params.id);
        if (!existingCampaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        if (existingCampaign.shop_id !== shopId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Don't allow updating campaigns that are sending or completed
        if (existingCampaign.status === 'sending' || existingCampaign.status === 'completed') {
            return NextResponse.json(
                { error: 'Cannot update campaign that is sending or completed' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const updateData: CampaignUpdateData = {};

        // Only include fields that are provided
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.template_id !== undefined) updateData.template_id = body.template_id;
        if (body.scheduled_send_at !== undefined) updateData.scheduled_send_at = body.scheduled_send_at;
        if (body.segment_criteria !== undefined) updateData.segment_criteria = body.segment_criteria;
        if (body.status !== undefined) updateData.status = body.status;

        const updatedCampaign = await updateCampaign(params.id, updateData);

        return NextResponse.json(updatedCampaign);

    } catch (error) {
        console.error('Error updating campaign:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete campaign
export async function DELETE(
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

        // Don't allow deleting campaigns that are sending
        if (campaign.status === 'sending') {
            return NextResponse.json(
                { error: 'Cannot delete campaign that is currently sending. Cancel it first.' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Delete campaign (cascade will delete recipients)
        const { error } = await supabase
            .from('ai_mass_campaigns')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting campaign:', error);
            return NextResponse.json(
                { error: 'Failed to delete campaign', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: 'Campaign deleted' });

    } catch (error) {
        console.error('Error deleting campaign:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

