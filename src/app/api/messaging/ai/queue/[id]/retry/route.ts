import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { retryMessage } from "@/app/(features)/messaging/lib/message-queue-service";
import { createClient } from "@/utils/supabase/server";

// POST - Retry failed message
export async function POST(
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

        // First verify the item exists and belongs to the shop
        const { data: existingItem, error: fetchError } = await supabase
            .from('ai_message_queue')
            .select('id, status, shop_id, retry_count')
            .eq('id', id)
            .single();

        if (fetchError || !existingItem) {
            return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
        }

        if (existingItem.shop_id !== shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Only allow retry of failed messages
        if (existingItem.status !== 'failed') {
            return NextResponse.json(
                {
                    error: 'Cannot retry message',
                    reason: `Message status is "${existingItem.status}". Only failed messages can be retried.`
                },
                { status: 400 }
            );
        }

        // Optional: Check max retry count (e.g., 3 retries max)
        const maxRetries = 3;
        if (existingItem.retry_count >= maxRetries) {
            return NextResponse.json(
                {
                    error: 'Max retries exceeded',
                    reason: `Message has been retried ${existingItem.retry_count} times. Maximum retries: ${maxRetries}.`
                },
                { status: 400 }
            );
        }

        // Retry the message
        const retriedItem = await retryMessage(id);

        return NextResponse.json({
            success: true,
            message: 'Message queued for retry',
            queueItem: retriedItem
        });

    } catch (error) {
        console.error('Error retrying queue item:', error);
        return NextResponse.json(
            {
                error: 'Failed to retry message',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

