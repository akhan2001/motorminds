import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import twilio from 'twilio';

// POST /api/twilio/webhooks - Handle incoming SMS messages
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const formData = new URLSearchParams(body);
        
        const webhookData = {
            From: formData.get('From'),
            To: formData.get('To'),
            Body: formData.get('Body'),
        };

        const supabase = await createClient();

        // Find the shop phone number that received this message
        const { data: phoneNumber, error: phoneError } = await supabase
            .from('twilio_phone_numbers')
            .select('*')
            .eq('phone_number', webhookData.To)
            .eq('status', 'active')
            .limit(1);

        if (phoneError || !phoneNumber || phoneNumber.length === 0) {
            console.error('Phone number not found:', webhookData.To);
            return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
        }

        const shopPhoneNumber = phoneNumber[0];
        const shopId = shopPhoneNumber.shop_id;

        // Store the incoming message
        const { data: storedMessage, error: messageError } = await supabase
            .from('sms_messages')
            .insert({
                shop_id: shopId,
                phone_number_id: shopPhoneNumber.id,
                direction: 'inbound',
                from_number: webhookData.From,
                to_number: webhookData.To,
                message_body: webhookData.Body,
                status: 'received',
            });

        if (messageError) {
            console.error('Failed to store incoming message:', messageError);
            return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
        }

        // Create or update conversation
        await supabase
            .from('sms_conversations')
            .upsert({
                shop_id: shopId,
                customer_phone: webhookData.From,
                last_message_at: new Date().toISOString(),
            }, {
                onConflict: 'shop_id,customer_phone'
            });

        console.log(`Incoming message processed for shop ${shopId}:`, {
            from: webhookData.From,
            to: webhookData.To,
            body: webhookData.Body?.substring(0, 50) + '...',
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Message processed successfully',
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}