import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

// GET - Get single queue item
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Queue item ID required' }, { status: 400 });
        }

        const supabase = await createClient();

        const { data: queueItem, error } = await supabase
            .from('ai_message_queue')
            .select('*')
            .eq('id', id)
            .eq('shop_id', shopId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(queueItem);

    } catch (error: any) {
        console.error('Error fetching queue item:', error);
        return NextResponse.json(
            { error: 'Failed to fetch queue item', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

// DELETE - Cancel pending message
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Queue item ID required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Verify queue item exists and belongs to shop
        const { data: existingItem, error: fetchError } = await supabase
            .from('ai_message_queue')
            .select('*')
            .eq('id', id)
            .eq('shop_id', shopId)
            .single();

        if (fetchError) {
            if (fetchError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
            }
            throw fetchError;
        }

        // Only allow canceling pending messages
        if (existingItem.status !== 'pending') {
            return NextResponse.json(
                { error: `Cannot cancel message with status: ${existingItem.status}` },
                { status: 400 }
            );
        }

        // Update status to cancelled
        const { error: updateError } = await supabase
            .from('ai_message_queue')
            .update({
                status: 'failed',
                error_message: 'Cancelled by user',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: 'Message cancelled successfully'
        });

    } catch (error: any) {
        console.error('Error cancelling queue item:', error);
        return NextResponse.json(
            { error: 'Failed to cancel message', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
