import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { markAsSent, markAsFailed } from "@/app/(features)/messaging/lib/message-queue-service";
import { replaceVariables } from "@/app/(features)/messaging/lib/variable-replacer";
import { createOrFindCustomerByPhone } from "@/utils/phone-number";
import { formatPhoneNumberE164 } from "@/utils/format-phone";

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

        console.log(`📬 Found ${allPendingMessages?.length || 0} pending messages to process`);

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
                console.log(`🔍 Looking for phone number for shop: ${shopId} (type: ${typeof shopId})`);
                
                // Try querying all phone numbers first to see what we get
                const { data: allPhones, error: allPhonesError } = await supabase
                    .from('twilio_phone_numbers')
                    .select('*')
                    .eq('shop_id', shopId);
                
                console.log(`📋 All phones for shop ${shopId}:`, allPhones?.length || 0, allPhones);
                
                const { data: phoneNumbers, error: phoneError } = await supabase
                    .from('twilio_phone_numbers')
                    .select('*')
                    .eq('shop_id', shopId)
                    .eq('status', 'active')
                    .limit(1);

                if (phoneError) {
                    console.error(`❌ Error fetching phone numbers:`, phoneError);
                }

                console.log(`📞 Phone numbers found:`, phoneNumbers?.length || 0, phoneNumbers);

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
                                    console.warn('Could not fetch work order for variable replacement:', err);
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

                        // Send message via Twilio
                        console.log(`📤 Sending SMS to ${formattedPhone} from ${shopPhoneNumber.phone_number}`);
                        
                        const twilioMessage = await twilioClient!.messages.create({
                            to: formattedPhone,
                            from: shopPhoneNumber.phone_number,
                            body: messageBody,
                        });

                        console.log(`✅ Twilio message sent: ${twilioMessage.sid}`);

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
                            await markAsFailed(queueItem.id, `SMS sent but failed to store: ${messageError.message}`);
                            failed++;
                            continue;
                        }

                        if (!storedMessage?.id) {
                            console.error('❌ SMS message stored but no ID returned');
                            await markAsFailed(queueItem.id, 'SMS sent but failed to get message ID');
                            failed++;
                            continue;
                        }

                        // Update queue with sms_message_id (UUID from sms_messages table)
                        await markAsSent(queueItem.id, storedMessage.id);
                        console.log(`✅ Linked queue item to SMS message: ${storedMessage.id}`);

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
