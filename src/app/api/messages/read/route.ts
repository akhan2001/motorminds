import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopIdForUser } from '@/utils/get-shop-id';

/**
 * POST /api/messages/read
 * Marks a conversation as read by setting last_read_message_id to the latest message
 * 
 * Body: { customer_phone: string }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();

        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        const body = await request.json();
        const { customer_phone } = body;

        if (!customer_phone) {
            return NextResponse.json({ error: 'customer_phone is required' }, { status: 400 });
        }

        // Get the latest message ID for this conversation
        const { data: latestMessage, error: msgError } = await supabase
            .from('sms_messages')
            .select('id')
            .eq('shop_id', shopId)
            .or(`from_number.eq.${customer_phone},to_number.eq.${customer_phone}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (msgError && msgError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error fetching latest message:', msgError);
            return NextResponse.json({ error: 'Failed to fetch latest message' }, { status: 500 });
        }

        // If no messages exist, nothing to mark as read
        if (!latestMessage) {
            return NextResponse.json({ success: true, message: 'No messages to mark as read' });
        }

        // Upsert the read state
        const { error: upsertError } = await supabase
            .from('sms_shop_read_state')
            .upsert(
                {
                    shop_id: shopId,
                    customer_phone: customer_phone,
                    last_read_message_id: latestMessage.id,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'shop_id,customer_phone',
                }
            );

        if (upsertError) {
            console.error('Error upserting read state:', upsertError);
            return NextResponse.json({ error: 'Failed to update read state' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            last_read_message_id: latestMessage.id 
        });

    } catch (error) {
        console.error('POST /api/messages/read error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
