import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { createOrFindCustomerByPhone, mergeDuplicateConversations } from '@/utils/phone-number';

// POST /api/twilio/webhooks - Handle incoming SMS messages
export async function POST(request: NextRequest) {
    try {
        console.log('🔵 Webhook received - Processing incoming SMS...');
        const body = await request.text();
        console.log('📥 Raw webhook body:', body);
        const formData = new URLSearchParams(body);
        
        const webhookData = {
            From: formData.get('From'),
            To: formData.get('To'),
            Body: formData.get('Body'),
        };

        console.log('📋 Parsed webhook data:', webhookData);

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Find the shop phone number that received this message
        console.log('🔍 Searching for phone number:', webhookData.To);
        
        const { data: phoneNumber, error: phoneError } = await supabase
            .from('twilio_phone_numbers')
            .select('*')
            .eq('phone_number', webhookData.To)
            .eq('status', 'active')
            .limit(1);

        console.log('🔍 Database query result:', {
            phoneNumber,
            phoneError,
            count: phoneNumber?.length || 0
        });

        if (phoneError) {
            console.error('❌ Database error:', phoneError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!phoneNumber || phoneNumber.length === 0) {
            console.error('❌ Phone number not found:', webhookData.To);
            
            // Let's check what phone numbers exist in the database
            const { data: allPhoneNumbers, error: allError } = await supabase
                .from('twilio_phone_numbers')
                .select('phone_number, status, shop_id')
                .limit(10);
            
            console.log('🔍 All phone numbers in database:', allPhoneNumbers);
            
            return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
        }

        const shopPhoneNumber = phoneNumber[0];
        const shopId = shopPhoneNumber.shop_id;
        
        console.log('✅ Phone number found:', {
            phoneNumber: shopPhoneNumber.phone_number,
            shopId: shopId,
            friendlyName: shopPhoneNumber.friendly_name
        });

        // Create or find customer from phone number using utility function
        console.log('🔍 Processing customer for phone:', webhookData.From);
        
        const { customerId, isNew, customer } = await createOrFindCustomerByPhone(
            supabase,
            shopId,
            webhookData.From || ''
        );

        console.log('✅ Customer processed:', { 
            customerId, 
            isNew, 
            name: customer.customer_name,
            phone: customer.customer_phone 
        });

        // Store the incoming message with customer reference
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
                customer_id: customerId,
            });

        if (messageError) {
            console.error('Failed to store incoming message:', messageError);
            return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
        }

        console.log('✅ Message stored successfully');

        // Handle conversations using utility function
        const fromPhone = webhookData.From || '';
        console.log('🔍 Processing conversations for phone:', fromPhone);
        
        const { keptConversationId, deletedCount } = await mergeDuplicateConversations(
            supabase,
            shopId,
            fromPhone,
            customerId
        );

        if (keptConversationId) {
            console.log('✅ Updated existing conversation:', keptConversationId);
            if (deletedCount > 0) {
                console.log(`🗑️ Merged ${deletedCount} duplicate conversations`);
            }
        } else {
            // Create new conversation
            console.log('✅ Creating new conversation for phone:', fromPhone);
            const { data: newConversation, error: convError } = await supabase
                .from('sms_conversations')
                .insert({
                    shop_id: shopId,
                    customer_phone: fromPhone,
                    customer_id: customerId,
                    last_message_at: new Date().toISOString(),
                })
                .select()
                .single();
                
            if (convError) {
                console.error('❌ Error creating conversation:', convError);
            } else {
                console.log('✅ Created new conversation:', newConversation.id);
            }
        }

        console.log('✅ Conversation updated successfully');

        console.log(`🎉 Incoming message processed for shop ${shopId}:`, {
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

// GET /api/twilio/webhooks - Test endpoint to verify webhook is accessible
export async function GET(request: NextRequest) {
    console.log('🔍 Webhook GET request received - Testing endpoint');
    return NextResponse.json({ 
        success: true, 
        message: 'Twilio webhook endpoint is working!',
        timestamp: new Date().toISOString(),
        url: request.url
    });
}