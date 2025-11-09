import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

// GET - Get single queue item
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

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
    context: { params: Promise<{ id: string }> }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

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

        // Delete the queue item (since it's pending, we can safely delete it)
        const { error: deleteError } = await supabase
            .from('ai_message_queue')
            .delete()
            .eq('id', id)
            .eq('shop_id', shopId);

        if (deleteError) {
            console.error('Error deleting queue item:', deleteError);
            throw deleteError;
        }

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
