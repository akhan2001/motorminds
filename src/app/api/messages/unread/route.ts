import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopIdForUser } from '@/utils/get-shop-id';

/**
 * GET /api/messages/unread
 * Returns whether the shop has any unread inbound SMS messages
 * 
 * Unread = any conversation where there's an inbound message with id > last_read_message_id
 * (or last_read_message_id is null for that conversation)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();

        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        // Get all conversations for this shop
        const { data: conversations, error: convError } = await supabase
            .from('sms_conversations')
            .select('customer_phone')
            .eq('shop_id', shopId);

        if (convError) {
            console.error('Error fetching conversations:', convError);
            return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
        }

        if (!conversations || conversations.length === 0) {
            return NextResponse.json({ hasUnread: false });
        }

        // Get read state for all conversations
        const { data: readStates, error: readError } = await supabase
            .from('sms_shop_read_state')
            .select('customer_phone, last_read_message_id')
            .eq('shop_id', shopId);

        if (readError) {
            console.error('Error fetching read states:', readError);
            // If table doesn't exist yet, treat all as potentially unread
            // Continue with empty read states
        }

        // Build a map of customer_phone -> last_read_message_id
        const readStateMap = new Map<string, string | null>();
        if (readStates) {
            for (const state of readStates) {
                readStateMap.set(state.customer_phone, state.last_read_message_id);
            }
        }

        // Check each conversation for unread inbound messages
        for (const conversation of conversations) {
            const lastReadMessageId = readStateMap.get(conversation.customer_phone);

            // Build the query for unread inbound messages
            let query = supabase
                .from('sms_messages')
                .select('id', { count: 'exact', head: true })
                .eq('shop_id', shopId)
                .eq('direction', 'inbound')
                .or(`from_number.eq.${conversation.customer_phone},to_number.eq.${conversation.customer_phone}`);

            // If there's a last read message, only look for messages after it
            if (lastReadMessageId) {
                query = query.gt('id', lastReadMessageId);
            }

            const { count, error: msgError } = await query;

            if (msgError) {
                console.error('Error checking unread messages:', msgError);
                continue;
            }

            // If we found any unread inbound messages, return true immediately
            if (count && count > 0) {
                return NextResponse.json({ hasUnread: true });
            }
        }

        // No unread messages found
        return NextResponse.json({ hasUnread: false });

    } catch (error) {
        console.error('GET /api/messages/unread error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
