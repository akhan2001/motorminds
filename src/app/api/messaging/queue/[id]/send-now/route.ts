import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

// POST - Send pending message immediately
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

        // Only allow sending pending messages
        if (existingItem.status !== 'pending') {
            return NextResponse.json(
                { error: `Cannot send message with status: ${existingItem.status}` },
                { status: 400 }
            );
        }

        // Update scheduled_send_at to now
        const { error: updateError } = await supabase
            .from('ai_message_queue')
            .update({
                scheduled_send_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) throw updateError;

        // Trigger the process-queue endpoint to send immediately
        try {
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/messaging/process-queue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error triggering process-queue:', error);
            // Don't fail the request if trigger fails - cron will pick it up
        }

        return NextResponse.json({
            success: true,
            message: 'Message scheduled for immediate sending'
        });

    } catch (error: any) {
        console.error('Error sending message now:', error);
        return NextResponse.json(
            { error: 'Failed to send message', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

