import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopIdForUser } from '@/utils/get-shop-id';
import twilio from 'twilio';
import { createOrFindCustomerByPhone, normalizePhoneNumber } from '@/utils/phone-number';

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
    mediaUrls?: string[]; // URLs for MMS media
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
            .select(`
                *,
                customer:customers(
                    id,
                    customer_name,
                    customer_email,
                    customer_phone
                )
            `)
            .eq('shop_id', shopId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (customerPhone) {
            // Normalize the phone number for better matching
            const phoneVariations = normalizePhoneNumber(customerPhone);
            
            // Use phone number variations for better matching
            const phoneConditions = phoneVariations.variations.map(phone => 
                `from_number.eq.${phone},to_number.eq.${phone}`
            ).join(',');
            
            query = query.or(phoneConditions);
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

// POST /api/twilio/messages - Send new message (SMS or MMS)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        const body: SendMessageRequest = await request.json();
        const { to, body: messageBody, customerName, mediaUrls } = body;

        // Validate input
        if (!to) {
            return NextResponse.json({ 
                error: 'Missing required field: to' 
            }, { status: 400 });
        }

        // Allow empty body if media is present
        if (!messageBody && (!mediaUrls || mediaUrls.length === 0)) {
            return NextResponse.json({ 
                error: 'Message must have text body or media attachments' 
            }, { status: 400 });
        }

        // Validate media URLs if present
        if (mediaUrls && mediaUrls.length > 10) {
            return NextResponse.json({ 
                error: 'Maximum 10 media attachments allowed per message' 
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

        // Normalize the destination phone number
        const phoneVariations = normalizePhoneNumber(to);
        const normalizedTo = phoneVariations.withPlusOne;

        // Create or find customer from phone number using utility function
        const { customerId, isNew, customer } = await createOrFindCustomerByPhone(
            supabase,
            shopId,
            normalizedTo,
            customerName
        );

        // Determine message type
        const hasMedia = mediaUrls && mediaUrls.length > 0;
        const messageType = hasMedia ? 'mms' : 'sms';

        // Build Twilio message options
        const twilioOptions: any = {
            to: normalizedTo,
            from: shopPhoneNumber.phone_number,
        };

        // Add body if present
        if (messageBody) {
            twilioOptions.body = messageBody;
        }

        // Add media URLs for MMS
        if (hasMedia) {
            twilioOptions.mediaUrl = mediaUrls;
        }

        // Send message via Twilio
        const twilioMessage = await twilioClient.messages.create(twilioOptions);

        // Store message in database with customer reference
        const { data: storedMessage, error: messageError } = await supabase
            .from('sms_messages')
            .insert({
                shop_id: shopId,
                phone_number_id: shopPhoneNumber.id,
                direction: 'outbound',
                from_number: shopPhoneNumber.phone_number,
                to_number: normalizedTo,
                message_body: messageBody || '',
                status: twilioMessage.status,
                customer_id: customerId,
                message_type: messageType,
                media_urls: mediaUrls || [],
                media_count: mediaUrls?.length || 0,
                twilio_sid: twilioMessage.sid,
            })
            .select()
            .single();

        if (messageError) {
            console.error('Failed to store message:', messageError);
        }

        // Store media records if present
        if (hasMedia && storedMessage) {
            const mediaRecords = mediaUrls!.map((url, index) => ({
                sms_message_id: storedMessage.id,
                shop_id: shopId,
                media_url: url,
                media_type: getMediaTypeFromUrl(url),
                file_name: `attachment_${index + 1}`,
            }));

            const { error: mediaInsertError } = await supabase
                .from('sms_media')
                .insert(mediaRecords);

            if (mediaInsertError) {
                console.error('Failed to store media records:', mediaInsertError);
            }
        }

        // Create or update conversation with customer reference using normalized phone
        await supabase
            .from('sms_conversations')
            .upsert({
                shop_id: shopId,
                customer_phone: normalizedTo,
                normalized_phone: normalizedTo,
                customer_id: customerId,
                last_message_at: new Date().toISOString(),
            }, {
                onConflict: 'shop_id,customer_phone'
            });

        return NextResponse.json({
            success: true,
            message: storedMessage,
            twilioSid: twilioMessage.sid,
            messageType,
        });

    } catch (error: any) {
        console.error('POST /api/twilio/messages error:', error);

        // Handle Twilio-specific errors
        if (error.code) {
            let errorMessage = 'Failed to send message';
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
                case 21617:
                    errorMessage = 'Message body too long. SMS max is 1600 characters';
                    break;
                case 21611:
                    errorMessage = 'This phone number cannot send MMS';
                    break;
                default:
                    errorMessage = error.message || 'Failed to send message';
            }
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper to guess media type from URL
function getMediaTypeFromUrl(url: string): string {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) return 'image/jpeg';
    if (lowerUrl.includes('.png')) return 'image/png';
    if (lowerUrl.includes('.gif')) return 'image/gif';
    if (lowerUrl.includes('.webp')) return 'image/webp';
    if (lowerUrl.includes('.mp4')) return 'video/mp4';
    if (lowerUrl.includes('.pdf')) return 'application/pdf';
    return 'image/jpeg'; // Default
}
