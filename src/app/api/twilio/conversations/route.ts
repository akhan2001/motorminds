import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopIdForUser } from '@/utils/get-shop-id';
import { normalizePhoneNumber } from '@/utils/phone-number';

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

// POST /api/twilio/conversations - Create or open conversation by customer (idempotent)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();

        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        const body = await request.json().catch(() => ({}));
        const customerId = body.customerId ?? body.customer_id;

        if (!customerId || typeof customerId !== 'string') {
            return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
        }

        // Fetch customer and ensure they have a phone number
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('id, customer_name, customer_phone, shop_id')
            .eq('id', customerId)
            .single();

        if (customerError || !customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        if (!customer.customer_phone || !customer.customer_phone.trim()) {
            return NextResponse.json(
                { error: 'Customer has no phone number. Add a phone number in the customer profile to start an SMS conversation.' },
                { status: 400 }
            );
        }

        const { withPlusOne: normalizedPhone } = normalizePhoneNumber(customer.customer_phone.trim());

        // Idempotent: upsert conversation (one per shop + customer_phone)
        const { data: conversation, error: upsertError } = await supabase
            .from('sms_conversations')
            .upsert(
                {
                    shop_id: shopId,
                    customer_phone: normalizedPhone,
                    normalized_phone: normalizedPhone,
                    customer_id: customer.id,
                    last_message_at: new Date().toISOString(),
                },
                {
                    onConflict: 'shop_id,customer_phone',
                    ignoreDuplicates: false,
                }
            )
            .select('id, shop_id, customer_phone, customer_id, last_message_at')
            .single();

        if (upsertError) {
            console.error('POST /api/twilio/conversations upsert error:', upsertError);
            return NextResponse.json({ error: 'Failed to create or open conversation' }, { status: 500 });
        }

        return NextResponse.json({
            conversation: {
                id: conversation.id,
                customer_phone: conversation.customer_phone,
                customer_id: conversation.customer_id,
                customer_name: customer.customer_name,
                shop_id: conversation.shop_id,
                last_message_at: conversation.last_message_at,
            },
        });
    } catch (error) {
        console.error('POST /api/twilio/conversations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}