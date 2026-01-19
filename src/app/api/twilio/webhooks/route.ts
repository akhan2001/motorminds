import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createOrFindCustomerByPhone, mergeDuplicateConversations, normalizePhoneNumber } from '@/utils/phone-number';

// Initialize Supabase client with service role for webhook processing
const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to download media from Twilio and upload to Supabase Storage
async function processMediaAttachments(
    supabase: any,
    formData: URLSearchParams,
    shopId: string,
    messageId: string
): Promise<{ mediaUrls: string[]; mediaRecords: any[] }> {
    const numMedia = parseInt(formData.get('NumMedia') || '0', 10);
    const mediaUrls: string[] = [];
    const mediaRecords: any[] = [];

    if (numMedia === 0) {
        return { mediaUrls, mediaRecords };
    }

    console.log(`📷 Processing ${numMedia} media attachments...`);

    for (let i = 0; i < numMedia; i++) {
        const mediaUrl = formData.get(`MediaUrl${i}`);
        const mediaContentType = formData.get(`MediaContentType${i}`);

        if (!mediaUrl) continue;

        try {
            console.log(`📷 Downloading media ${i + 1}/${numMedia}: ${mediaUrl}`);
            
            // Download media from Twilio (requires authentication)
            const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
            const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
            
            const mediaResponse = await fetch(mediaUrl, {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')
                }
            });

            if (!mediaResponse.ok) {
                console.error(`❌ Failed to download media: ${mediaResponse.status}`);
                // Still save the Twilio URL as fallback
                mediaUrls.push(mediaUrl);
                continue;
            }

            const mediaBuffer = await mediaResponse.arrayBuffer();
            const fileExtension = getFileExtension(mediaContentType || 'image/jpeg');
            const fileName = `media/${shopId}/${messageId}/${Date.now()}_${i}${fileExtension}`;

            // Upload to Supabase Storage (motorminds bucket)
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('motorminds')
                .upload(fileName, mediaBuffer, {
                    contentType: mediaContentType || 'image/jpeg',
                    upsert: false
                });

            if (uploadError) {
                console.error(`❌ Failed to upload media to storage:`, uploadError);
                // Use Twilio URL as fallback
                mediaUrls.push(mediaUrl);
                
                mediaRecords.push({
                    sms_message_id: messageId,
                    shop_id: shopId,
                    media_url: mediaUrl,
                    media_type: mediaContentType,
                    file_name: `media_${i}${fileExtension}`,
                    file_size: mediaBuffer.byteLength
                });
            } else {
                // Get public URL from storage
                const { data: urlData } = supabase
                    .storage
                    .from('motorminds')
                    .getPublicUrl(fileName);

                const storageUrl = urlData.publicUrl;
                mediaUrls.push(storageUrl);

                mediaRecords.push({
                    sms_message_id: messageId,
                    shop_id: shopId,
                    media_url: storageUrl,
                    storage_path: fileName,
                    media_type: mediaContentType,
                    file_name: `media_${i}${fileExtension}`,
                    file_size: mediaBuffer.byteLength
                });

                console.log(`✅ Media ${i + 1} uploaded: ${storageUrl}`);
            }
        } catch (error) {
            console.error(`❌ Error processing media ${i}:`, error);
            // Use Twilio URL as fallback
            mediaUrls.push(mediaUrl);
        }
    }

    return { mediaUrls, mediaRecords };
}

// Helper to get file extension from MIME type
function getFileExtension(contentType: string): string {
    const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/heic': '.heic',
        'image/heif': '.heif',
        'video/mp4': '.mp4',
        'video/3gpp': '.3gp',
        'audio/mpeg': '.mp3',
        'audio/ogg': '.ogg',
        'application/pdf': '.pdf'
    };
    return mimeToExt[contentType] || '.bin';
}

// POST /api/twilio/webhooks - Handle incoming SMS/MMS messages
export async function POST(request: NextRequest) {
    try {
        console.log('🔵 Webhook received - Processing incoming message...');
        const body = await request.text();
        console.log('📥 Raw webhook body length:', body.length);
        const formData = new URLSearchParams(body);
        
        // Extract all webhook data including media
        const numMedia = parseInt(formData.get('NumMedia') || '0', 10);
        const webhookData = {
            From: formData.get('From'),
            To: formData.get('To'),
            Body: formData.get('Body') || '',
            NumMedia: numMedia,
            MessageSid: formData.get('MessageSid'),
            SmsMessageSid: formData.get('SmsMessageSid'),
        };

        console.log('📋 Parsed webhook data:', {
            ...webhookData,
            hasMedia: numMedia > 0
        });

        const supabase = getSupabase();

        // Find the shop phone number that received this message
        console.log('🔍 Searching for phone number:', webhookData.To);
        
        const { data: phoneNumber, error: phoneError } = await supabase
            .from('twilio_phone_numbers')
            .select('*')
            .eq('phone_number', webhookData.To)
            .eq('status', 'active')
            .limit(1);

        if (phoneError) {
            console.error('❌ Database error:', phoneError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!phoneNumber || phoneNumber.length === 0) {
            console.error('❌ Phone number not found:', webhookData.To);
            return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
        }

        const shopPhoneNumber = phoneNumber[0];
        const shopId = shopPhoneNumber.shop_id;
        
        console.log('✅ Phone number found:', {
            phoneNumber: shopPhoneNumber.phone_number,
            shopId: shopId,
            friendlyName: shopPhoneNumber.friendly_name
        });

        // Normalize the incoming phone number
        const phoneVariations = normalizePhoneNumber(webhookData.From || '');
        const normalizedPhone = phoneVariations.withPlusOne;

        // Create or find customer from phone number
        console.log('🔍 Processing customer for phone:', normalizedPhone);
        
        const { customerId, isNew, customer } = await createOrFindCustomerByPhone(
            supabase,
            shopId,
            normalizedPhone
        );

        console.log('✅ Customer processed:', { 
            customerId, 
            isNew, 
            name: customer.customer_name,
            phone: customer.customer_phone 
        });

        // Determine message type
        const messageType = numMedia > 0 ? 'mms' : 'sms';

        // Store the incoming message with customer reference
        const { data: storedMessage, error: messageError } = await supabase
            .from('sms_messages')
            .insert({
                shop_id: shopId,
                phone_number_id: shopPhoneNumber.id,
                direction: 'inbound',
                from_number: normalizedPhone,
                to_number: webhookData.To,
                message_body: webhookData.Body,
                status: 'received',
                customer_id: customerId,
                message_type: messageType,
                media_count: numMedia,
                twilio_sid: webhookData.MessageSid || webhookData.SmsMessageSid,
            })
            .select()
            .single();

        if (messageError) {
            console.error('❌ Failed to store incoming message:', messageError);
            return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
        }

        console.log('✅ Message stored successfully:', storedMessage.id);

        // Process media attachments if present
        if (numMedia > 0 && storedMessage) {
            const { mediaUrls, mediaRecords } = await processMediaAttachments(
                supabase,
                formData,
                shopId,
                storedMessage.id
            );

            // Update message with media URLs
            if (mediaUrls.length > 0) {
                await supabase
                    .from('sms_messages')
                    .update({ media_urls: mediaUrls })
                    .eq('id', storedMessage.id);

                // Insert media records
                if (mediaRecords.length > 0) {
                    const { error: mediaInsertError } = await supabase
                        .from('sms_media')
                        .insert(mediaRecords);

                    if (mediaInsertError) {
                        console.error('❌ Failed to store media records:', mediaInsertError);
                    } else {
                        console.log(`✅ Stored ${mediaRecords.length} media records`);
                    }
                }
            }
        }

        // Handle conversations - use normalized phone number
        console.log('🔍 Processing conversations for phone:', normalizedPhone);
        
        const { keptConversationId, deletedCount } = await mergeDuplicateConversations(
            supabase,
            shopId,
            normalizedPhone,
            customerId
        );

        if (keptConversationId) {
            console.log('✅ Updated existing conversation:', keptConversationId);
            if (deletedCount > 0) {
                console.log(`🗑️ Merged ${deletedCount} duplicate conversations`);
            }
        } else {
            // Create new conversation with normalized phone
            console.log('✅ Creating new conversation for phone:', normalizedPhone);
            const { data: newConversation, error: convError } = await supabase
                .from('sms_conversations')
                .insert({
                    shop_id: shopId,
                    customer_phone: normalizedPhone,
                    normalized_phone: normalizedPhone,
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

        console.log(`🎉 Incoming ${messageType.toUpperCase()} processed for shop ${shopId}:`, {
            from: normalizedPhone,
            to: webhookData.To,
            body: webhookData.Body?.substring(0, 50) + (webhookData.Body && webhookData.Body.length > 50 ? '...' : ''),
            mediaCount: numMedia
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Message processed successfully',
            messageType,
            mediaCount: numMedia
        });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/twilio/webhooks - Test endpoint to verify webhook is accessible
export async function GET(request: NextRequest) {
    console.log('🔍 Webhook GET request received - Testing endpoint');
    return NextResponse.json({ 
        success: true, 
        message: 'Twilio webhook endpoint is working! MMS support enabled.',
        timestamp: new Date().toISOString(),
        url: request.url,
        features: ['sms', 'mms', 'media-attachments']
    });
}
