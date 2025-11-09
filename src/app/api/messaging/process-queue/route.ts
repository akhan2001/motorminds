import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import twilio from 'twilio';
import { markAsSent, markAsFailed } from "@/app/(features)/messaging/lib/message-queue-service";
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

// Simple in-memory rate limiter
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

        // Get all pending messages ready to send with related data
        const { data: allPendingMessages, error: queueError } = await supabase
            .from('ai_message_queue')
            .select(`
                *,
                customer:customers(id, customer_name, customer_phone, customer_email),
                template:ai_message_templates(id, name, message_template, trigger_type),
                shop:shops(id, shop_name, shop_phone)
            `)
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

                        // Get customer phone number
                        const customerPhone = (queueItem.customer as any)?.customer_phone;
                        if (!customerPhone) {
                            await markAsFailed(queueItem.id, 'Customer phone number not available');
                            failed++;
                            continue;
                        }

                        // Format phone number to E.164 format (required for Twilio)
                        const formattedPhone = formatPhoneNumberE164(customerPhone);

                        // Generate message body from template if available
                        let messageBody: string;
                        
                        if (queueItem.template && (queueItem.template as any)?.message_template) {
                            // Re-render template with trigger_data
                            const templateData = {
                                customer_name: (queueItem.customer as any)?.customer_name || 'Customer',
                                shop_name: (queueItem.shop as any)?.shop_name || 'Your Auto Shop',
                                shop_phone: (queueItem.shop as any)?.shop_phone || '',
                                ...queueItem.trigger_data // Includes work_order_id, service_type, vehicle_info, etc.
                            };
                            
                            messageBody = replaceVariables(
                                (queueItem.template as any).message_template,
                                templateData,
                                { missingVariableBehavior: 'empty' }
                            );
                        } else {
                            // Fallback: try to generate a simple message from trigger_data
                            messageBody = `Hi ${(queueItem.customer as any)?.customer_name || 'there'}, thank you for your business at ${(queueItem.shop as any)?.shop_name || 'our shop'}!`;
                        }

                        const customerId = queueItem.customer_id;
                        const customerName = (queueItem.customer as any)?.customer_name;

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
                                customer_name: customerName || null
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
