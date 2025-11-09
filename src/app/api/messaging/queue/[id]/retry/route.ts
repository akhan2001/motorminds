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

        // Only allow retrying failed messages
        if (existingItem.status !== 'failed') {
            return NextResponse.json(
                { error: `Cannot retry message with status: ${existingItem.status}` },
                { status: 400 }
            );
        }

        // Check retry count
        if (existingItem.retry_count >= 3) {
            return NextResponse.json(
                { error: 'Maximum retry attempts (3) reached' },
                { status: 400 }
            );
        }

        await retryMessage(id);

        return NextResponse.json({
            success: true,
            message: 'Message queued for retry'
        });

    } catch (error: any) {
        console.error('Error retrying message:', error);
        return NextResponse.json(
            { error: 'Failed to retry message', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}
