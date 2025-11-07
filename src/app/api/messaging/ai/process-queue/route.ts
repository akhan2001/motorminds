import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import twilio from 'twilio';
import { getPendingMessages, markAsSent, markAsFailed } from "@/app/(features)/messaging/lib/message-queue-service";
import { getTemplate } from "@/app/(features)/messaging/lib/message-template-service";
import { replaceVariables } from "@/app/(features)/messaging/lib/variable-replacer";
import { createOrFindCustomerByPhone } from "@/utils/phone-number";
import { formatPhoneNumberE164 } from "@/utils/format-phone";

// Initialize Twilio client
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

// Rate limiter: 100 messages per minute (Twilio limit)
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60000; // 1 minute

// Simple in-memory rate limiter (for single instance)
// For production with multiple instances, use Redis or similar
let messageCount = 0;
let windowStart = Date.now();

function checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset window if a minute has passed
    if (now - windowStart >= RATE_WINDOW_MS) {
        messageCount = 0;
        windowStart = now;
    }
    
    // Check if we're at the limit
    if (messageCount >= RATE_LIMIT) {
        return false;
    }
    
    messageCount++;
    return true;
}

// POST - Process pending messages
// Called by Vercel Cron or manual trigger
export async function POST(request: NextRequest) {
    try {
        // Optional: Check for authorization header (for cron jobs)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            // Allow manual triggers without auth, but require auth for cron
            const isManualTrigger = !authHeader;
            if (!isManualTrigger) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const supabase = await createClient();
        const now = new Date().toISOString();

        // Get all pending messages ready to send (across all shops)
        const { data: allPendingMessages, error: queueError } = await supabase
            .from('ai_message_queue')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_send_at', now)
            .order('scheduled_send_at', { ascending: true })
            .limit(100); // Process max 100 messages per run to respect rate limits

        if (queueError) {
            console.error('Error fetching queue:', queueError);
            return NextResponse.json(
                { error: 'Failed to fetch queue', details: queueError.message },
                { status: 500 }
            );
        }

        if (!allPendingMessages || allPendingMessages.length === 0) {
            return NextResponse.json({
                success: true,
                processed: 0,
                message: 'No pending messages to process'
            });
        }

        // Group messages by shop_id for efficient processing
        const messagesByShop = new Map<string, typeof allPendingMessages>();
        for (const msg of allPendingMessages) {
            if (!messagesByShop.has(msg.shop_id)) {
                messagesByShop.set(msg.shop_id, []);
            }
            messagesByShop.get(msg.shop_id)!.push(msg);
        }

        let processed = 0;
        let failed = 0;
        const errors: string[] = [];

        // Process messages for each shop
        for (const [shopId, pendingMessages] of messagesByShop.entries()) {
            try {

                if (pendingMessages.length === 0) continue;

                // Get shop's Twilio phone number
                const { data: phoneNumbers, error: phoneError } = await supabase
                    .from('twilio_phone_numbers')
                    .select('*')
                    .eq('shop_id', shopId)
                    .eq('status', 'active')
                    .limit(1);

                if (phoneError || !phoneNumbers || phoneNumbers.length === 0) {
                    console.error(`No active phone number for shop ${shopId}`);
                    // Mark all messages as failed for this shop
                    for (const msg of pendingMessages) {
                        await markAsFailed(msg.id, 'No active Twilio phone number configured for shop');
                        failed++;
                    }
                    continue;
                }

                const shopPhoneNumber = phoneNumbers[0];

                // Process each message in this shop's batch
                for (const queueItem of pendingMessages) {
                    try {
                        // Check rate limit
                        if (!checkRateLimit()) {
                            console.log('Rate limit reached, stopping processing');
                            break; // Stop processing this batch
                        }

                        let messageBody = queueItem.message_body;
                        let customerData: Record<string, any> = {};

                        // If template_id exists, fetch template and replace variables
                        if (queueItem.template_id) {
                            const template = await getTemplate(queueItem.template_id);
                            
                            if (!template) {
                                throw new Error(`Template ${queueItem.template_id} not found`);
                            }

                            // Get customer data if customer_id exists
                            if (queueItem.customer_id) {
                                const { data: customer, error: customerError } = await supabase
                                    .from('customers')
                                    .select(`
                                        *,
                                        customer_vehicles(*)
                                    `)
                                    .eq('id', queueItem.customer_id)
                                    .single();

                                if (!customerError && customer) {
                                    // Format customer data for variable replacement
                                    customerData = {
                                        customer: {
                                            customer_name: customer.customer_name,
                                            customer_phone: customer.customer_phone,
                                            customer_email: customer.customer_email,
                                            customer_address: customer.customer_address
                                        },
                                        vehicle: customer.customer_vehicles?.[0] || {},
                                        shop: {
                                            shop_name: '', // Will be fetched if needed
                                            shop_phone: shopPhoneNumber.phone_number
                                        }
                                    };

                                    // Get shop info if needed
                                    const { data: shop } = await supabase
                                        .from('shops')
                                        .select('shop_name, shop_phone, shop_address, shop_email')
                                        .eq('id', shopId)
                                        .single();

                                    if (shop) {
                                        customerData.shop = {
                                            shop_name: shop.shop_name,
                                            shop_phone: shop.shop_phone || shopPhoneNumber.phone_number,
                                            shop_address: shop.shop_address,
                                            shop_email: shop.shop_email
                                        };
                                    }
                                }
                            }

                            // Replace variables in template
                            messageBody = replaceVariables(template.template, customerData, {
                                missingVariableBehavior: 'empty'
                            });
                        }

                        // Format phone number to E.164 format (required for Twilio)
                        const formattedPhone = formatPhoneNumberE164(queueItem.phone_number);

                        // Create or find customer
                        const { customerId, customer } = await createOrFindCustomerByPhone(
                            supabase,
                            shopId,
                            formattedPhone,
                            customerData.customer?.customer_name
                        );

                        // Send message via Twilio
                        const twilioMessage = await twilioClient.messages.create({
                            to: formattedPhone,
                            from: shopPhoneNumber.phone_number,
                            body: messageBody,
                        });

                        // Store message in sms_messages
                        const { data: storedMessage, error: messageError } = await supabase
                            .from('sms_messages')
                            .insert({
                                shop_id: shopId,
                                phone_number_id: shopPhoneNumber.id,
                                direction: 'outbound',
                                from_number: shopPhoneNumber.phone_number,
                                to_number: formattedPhone,
                                message_body: messageBody,
                                status: twilioMessage.status || 'sent',
                                customer_id: customerId,
                            })
                            .select()
                            .single();

                        if (messageError) {
                            console.error('Failed to store SMS message:', messageError);
                        }

                        // Update queue with sms_message_id
                        await markAsSent(queueItem.id, storedMessage?.id || twilioMessage.sid);

                        // Update sms_conversations
                        await supabase
                            .from('sms_conversations')
                            .upsert({
                                shop_id: shopId,
                                customer_phone: formattedPhone,
                                customer_id: customerId,
                                last_message_at: new Date().toISOString(),
                                customer_name: customer?.customer_name || null
                            }, {
                                onConflict: 'shop_id,customer_phone'
                            });

                        processed++;

                    } catch (error: any) {
                        console.error(`Error processing queue item ${queueItem.id}:`, error);
                        
                        // Mark as failed
                        const errorMessage = error.message || error.toString() || 'Unknown error';
                        await markAsFailed(queueItem.id, errorMessage);
                        failed++;
                        errors.push(`Queue item ${queueItem.id}: ${errorMessage}`);
                    }
                }

            } catch (error: any) {
                console.error(`Error processing shop ${shopId}:`, error);
                errors.push(`Shop ${shopId}: ${error.message || 'Unknown error'}`);
            }
        }

        return NextResponse.json({
            success: true,
            processed,
            failed,
            errors: errors.length > 0 ? errors : undefined,
            message: `Processed ${processed} messages, ${failed} failed`
        });

    } catch (error: any) {
        console.error('Error processing message queue:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}

