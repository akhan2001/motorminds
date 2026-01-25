import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopIdForUser } from '@/utils/get-shop-id';

// GET /api/twilio/conversations - Get conversations
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        const { data: conversations, error } = await supabase
            .from('sms_conversations')
            .select(`
                *,
                customer:customers(
                    id,
                    customer_name,
                    customer_email,
                    customer_phone,
                    customer_address,
                    customer_vehicle,
                    license_plate,
                    notes,
                    tags
                )
            `)
            .eq('shop_id', shopId)
            .order('last_message_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
        }

        // Get the most recent message for each conversation
        const conversationsWithMessages = await Promise.all(
            conversations.map(async (conversation) => {
                // Use the phone number utility to find messages with different phone formats
                const { data: recentMessage } = await supabase
                    .from('sms_messages')
                    .select('message_body, created_at, direction, media_count, message_type')
                    .eq('shop_id', shopId)
                    .or(`from_number.eq.${conversation.customer_phone},to_number.eq.${conversation.customer_phone}`)
                    .order('created_at', { ascending: false })
                    .limit(1);

                return {
                    ...conversation,
                    recent_message: recentMessage?.[0] || null,
                };
            })
        );

        return NextResponse.json({ conversations: conversationsWithMessages });

    } catch (error) {
        console.error('GET /api/twilio/conversations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}