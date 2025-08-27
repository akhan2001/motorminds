import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopIdForUser } from '@/utils/get-shop-id';
import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

// Types
interface SendMessageRequest {
    to: string;
    body: string;
    customerName?: string;
}

// GET /api/twilio/messages - Fetch messages 
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const customerPhone = searchParams.get('customerPhone');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
            .from('sms_messages')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (customerPhone) {
            query = query.or(`from_number.eq.${customerPhone},to_number.eq.${customerPhone}`);
        }

        const { data: messages, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
        }

        return NextResponse.json({ messages });

    } catch (error) {
        console.error('GET /api/twilio/messages error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/twilio/messages - Send new message
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        const body: SendMessageRequest = await request.json();
        const { to, body: messageBody, customerName } = body;

        // Validate input
        if (!to || !messageBody) {
            return NextResponse.json({ 
                error: 'Missing required fields: to, body' 
            }, { status: 400 });
        }

        // Get shop's phone number
        const { data: phoneNumbers, error: phoneError } = await supabase
            .from('twilio_phone_numbers')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', 'active')
            .limit(1);

        if (phoneError || !phoneNumbers || phoneNumbers.length === 0) {
            return NextResponse.json({ 
                error: 'No active phone number found for this shop' 
            }, { status: 400 });
        }

        const shopPhoneNumber = phoneNumbers[0];

        // Send message via Twilio
        const twilioMessage = await twilioClient.messages.create({
            to: to,
            from: shopPhoneNumber.phone_number,
            body: messageBody,
        });

        // Store message in database
        const { data: storedMessage, error: messageError } = await supabase
            .from('sms_messages')
            .insert({
                shop_id: shopId,
                phone_number_id: shopPhoneNumber.id,
                direction: 'outbound',
                from_number: shopPhoneNumber.phone_number,
                to_number: to,
                message_body: messageBody,
                status: twilioMessage.status,
            })
            .select()
            .single();

        if (messageError) {
            console.error('Failed to store message:', messageError);
        }

        // Create or update conversation
        await supabase
            .from('sms_conversations')
            .upsert({
                shop_id: shopId,
                customer_phone: to,
                customer_name: customerName || null,
                last_message_at: new Date().toISOString(),
            }, {
                onConflict: 'shop_id,customer_phone'
            });

        return NextResponse.json({
            success: true,
            message: storedMessage,
            twilioSid: twilioMessage.sid,
        });

    } catch (error: any) {
        console.error('POST /api/twilio/messages error:', error);

        // Handle Twilio-specific errors
        if (error.code) {
            let errorMessage = 'Failed to send SMS';
            switch (error.code) {
                case 21211:
                    errorMessage = 'Invalid phone number';
                    break;
                case 21408:
                    errorMessage = 'Permission denied for this phone number';
                    break;
                case 21610:
                    errorMessage = 'Message cannot be sent to this number';
                    break;
                case 21614:
                    errorMessage = 'Invalid phone number format';
                    break;
                case 20003:
                    errorMessage = 'Authentication error';
                    break;
                default:
                    errorMessage = error.message || 'Failed to send SMS';
            }
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}