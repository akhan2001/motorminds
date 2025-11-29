import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient, SupabaseClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { replaceVariables } from "@/app/(features)/messaging/lib/variable-replacer";
import { createOrFindCustomerByPhone } from "@/utils/phone-number";
import { formatPhoneNumberE164 } from "@/utils/format-phone";

// Helper functions that use the provided Supabase client (for service role access)
async function markAsSentWithClient(supabase: SupabaseClient, queueId: string, smsMessageId: string, originalRetryCount?: number): Promise<void> {
    const updateData: any = {
        status: 'sent',
        sms_message_id: smsMessageId,
        sent_at: new Date().toISOString()
    };
    
    // Reset retry_count if it was used as a processing flag
    if (originalRetryCount !== undefined) {
        updateData.retry_count = originalRetryCount;
    }
    
    const { error } = await supabase
        .from('ai_message_queue')
        .update(updateData)
        .eq('id', queueId);

    if (error) {
        console.error(`Failed to mark message ${queueId} as sent:`, error);
        throw error;
    }
}

async function markAsFailedWithClient(supabase: SupabaseClient, queueId: string, errorMessage: string, originalRetryCount?: number): Promise<void> {
    const updateData: any = {
        status: 'failed',
        error_message: errorMessage
    };
    
    // Reset retry_count if it was used as a processing flag
    if (originalRetryCount !== undefined) {
        updateData.retry_count = originalRetryCount;
    }
    
    const { error } = await supabase
        .from('ai_message_queue')
        .update(updateData)
        .eq('id', queueId);

    if (error) {
        console.error(`Failed to mark message ${queueId} as failed:`, error);
        throw error;
    }
}

// Helper to format delay time in human-readable format
function formatDelayTime(hours: number): string {
    if (hours === 0) return 'immediately'
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`
    
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`
    
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''}`
    
    const months = Math.floor(days / 30)
    return `${months} month${months !== 1 ? 's' : ''}`
}

// Initialize Twilio client
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

if (!twilioAccountSid || !twilioAuthToken) {
    console.warn('⚠️ Twilio credentials not configured. SMS sending will fail.');
}

const twilioClient = twilioAccountSid && twilioAuthToken 
    ? twilio(twilioAccountSid, twilioAuthToken)
    : null;

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

        // Use service role client for process-queue to bypass RLS (this endpoint may be called by cron jobs)
        const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
            ? createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )
            : await createClient();
        
        const now = new Date().toISOString();

        // Cleanup: Reset any messages stuck with abnormally high retry_count (from previous processing attempts)
        // This handles cases where a process crashed while processing
        await supabase
            .from('ai_message_queue')
            .update({ retry_count: 0 })
            .eq('status', 'pending')
            .gte('retry_count', 1000000); // Reset processing flags

        // Get all pending messages ready to send with related data
        // Exclude messages with abnormally high retry_count (being processed)
        const { data: allPendingMessages, error: queueError } = await supabase
            .from('ai_message_queue')
            .select(`
                *,
                customer:customers(id, customer_name, customer_phone, customer_email),
                template:ai_message_templates(id, name, message_template, trigger_type),
                shop:shops(id, shop_name, shop_phone)
            `)
            .eq('status', 'pending')
            .lt('retry_count', 1000000) // Exclude messages being processed
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

        // Check if Twilio is configured
        if (!twilioClient) {
            console.error('❌ Twilio not configured');
            return NextResponse.json({
                success: false,
                error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.',
                processed: 0,
                failed: allPendingMessages.length
            }, { status: 500 });
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

                if (phoneError) {
                    console.error(`❌ Error fetching phone numbers:`, phoneError);
                }

                if (phoneError || !phoneNumbers || phoneNumbers.length === 0) {
                    console.error(`❌ No active phone number for shop ${shopId}`);
                    // Mark all messages as failed for this shop
                    for (const msg of pendingMessages) {
                        try {
                            await markAsFailed(msg.id, 'No active Twilio phone number configured for shop. Please add a phone number in Settings.');
                            failed++;
                        } catch (markError) {
                            console.error(`Failed to mark message ${msg.id} as failed:`, markError);
                        }
                    }
                    errors.push(`Shop ${shopId}: No active Twilio phone number configured`);
                    continue;
                }

                const shopPhoneNumber = phoneNumbers[0];

                // Process each message in this shop's batch
                for (const queueItem of pendingMessages) {
                    try {
                        // CRITICAL: Atomically claim the message by updating retry_count
                        // This acts as a lock - if update affects 0 rows, message was already claimed
                        // We increment retry_count temporarily as a "processing" flag
                        const { data: claimedItem, error: claimError } = await supabase
                            .from('ai_message_queue')
                            .update({ 
                                retry_count: queueItem.retry_count + 1000000 // Use large number as processing flag
                            })
                            .eq('id', queueItem.id)
                            .eq('status', 'pending') // Only update if still pending
                            .select()
                            .single();

                        if (claimError || !claimedItem) {
                            // Message was already processed by another instance, skip it
                            console.log(`⏭️  Message ${queueItem.id} already claimed by another process, skipping`);
                            continue;
                        }

                        // Check rate limit
                        if (!checkRateLimit()) {
                            // Reset retry_count back to original if we hit rate limit
                            await supabase
                                .from('ai_message_queue')
                                .update({ retry_count: queueItem.retry_count })
                                .eq('id', queueItem.id);
                            break; // Stop processing this batch
                        }

                        // Get customer phone number
                        const customerPhone = (queueItem.customer as any)?.customer_phone;
                        if (!customerPhone) {
                            await markAsFailedWithClient(supabase, queueItem.id, 'Customer phone number not available', queueItem.retry_count);
                            failed++;
                            continue;
                        }

                        const formattedPhone = formatPhoneNumberE164(customerPhone);
                        let messageBody: string;
                        
                        if (queueItem.template && (queueItem.template as any)?.message_template) {
                            // Fetch work order details if available for better variable replacement
                            let workOrderData: any = null;
                            if (queueItem.trigger_data?.work_order_id) {
                                try {
                                    const { data: workOrder } = await supabase
                                        .from('work_orders')
                                        .select(`
                                            *,
                                            customer:customers(*),
                                            vehicle:customer_vehicles(*),
                                            shop:shops(*)
                                        `)
                                        .eq('id', queueItem.trigger_data.work_order_id)
                                        .single();
                                    
                                    workOrderData = workOrder;
                                } catch (err) {
                                    // Work order not found, continue with available data
                                }
                            }
                            
                            // Build template data with all available information
                            // Support both flat (vehicle_make) and nested (vehicle.make) syntax
                            const vehicle = workOrderData?.vehicle || null;
                            const templateData: any = {
                                // Flat syntax (for backward compatibility)
                                customer_name: (queueItem.customer as any)?.customer_name || 'Customer',
                                shop_name: (queueItem.shop as any)?.shop_name || 'Your Auto Shop',
                                shop_phone: (queueItem.shop as any)?.shop_phone || '',
                                vehicle_make: vehicle?.make || '',
                                vehicle_model: vehicle?.model || '',
                                vehicle_year: vehicle?.year?.toString() || '',
                                vehicle_info: vehicle 
                                    ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim()
                                    : '',
                                work_order_title: workOrderData?.title || queueItem.trigger_data?.work_order_title || '',
                                service_type: queueItem.trigger_data?.service_type || workOrderData?.title || '',
                                delay_time: queueItem.template?.delay_hours 
                                    ? formatDelayTime(queueItem.template.delay_hours)
                                    : '',
                                // Nested syntax (for [vehicle.make] style templates)
                                vehicle: vehicle ? {
                                    make: vehicle.make || '',
                                    model: vehicle.model || '',
                                    year: vehicle.year?.toString() || '',
                                    license_plate: vehicle.license_plate || '',
                                    vin: vehicle.vin || ''
                                } : null,
                                customer: {
                                    customer_name: (queueItem.customer as any)?.customer_name || 'Customer',
                                    customer_phone: (queueItem.customer as any)?.customer_phone || '',
                                    customer_email: (queueItem.customer as any)?.customer_email || ''
                                },
                                shop: {
                                    shop_name: (queueItem.shop as any)?.shop_name || 'Your Auto Shop',
                                    shop_phone: (queueItem.shop as any)?.shop_phone || '',
                                    shop_address: (queueItem.shop as any)?.shop_address || ''
                                },
                                work_order: {
                                    title: workOrderData?.title || queueItem.trigger_data?.work_order_title || '',
                                    work_order_number: workOrderData?.work_order_number || ''
                                }
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

                        const twilioMessage = await twilioClient!.messages.create({
                            to: formattedPhone,
                            from: shopPhoneNumber.phone_number,
                            body: messageBody,
                        });

                        // Store message in sms_messages (required for foreign key)
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
                            console.error('❌ Failed to store SMS message:', messageError);
                            // Mark as failed if we can't store the message (required for foreign key)
                            await markAsFailedWithClient(supabase, queueItem.id, `SMS sent but failed to store: ${messageError.message}`, queueItem.retry_count);
                            failed++;
                            continue;
                        }

                        if (!storedMessage?.id) {
                            console.error('❌ SMS message stored but no ID returned');
                            await markAsFailedWithClient(supabase, queueItem.id, 'SMS sent but failed to get message ID', queueItem.retry_count);
                            failed++;
                            continue;
                        }

                        // Update queue with sms_message_id (UUID from sms_messages table)
                        // Use atomic update with service role client
                        // Reset retry_count to original value when marking as sent
                        await markAsSentWithClient(supabase, queueItem.id, storedMessage.id, queueItem.retry_count);

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
                        
                        // Mark as failed using service role client
                        const errorMessage = error.message || error.toString() || 'Unknown error';
                        await markAsFailedWithClient(supabase, queueItem.id, errorMessage, queueItem.retry_count);
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
