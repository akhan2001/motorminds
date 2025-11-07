import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import twilio from 'twilio';
import { getCampaigns, getCampaign, updateCampaign, getCampaignRecipients } from "@/app/(features)/messaging/lib/campaign-service";
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
const BATCH_SIZE = 50; // Process 50 recipients at a time

// Simple in-memory rate limiter (for single instance)
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

// POST - Process mass send campaigns
// Called by cron or manually
export async function POST(request: NextRequest) {
    try {
        // Optional: Check for authorization header (for cron jobs)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            const isManualTrigger = !authHeader;
            if (!isManualTrigger) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const supabase = await createClient();
        let totalProcessed = 0;
        let totalFailed = 0;
        const errors: string[] = [];
        const campaignResults: Array<{
            campaign_id: string;
            campaign_name: string;
            processed: number;
            failed: number;
            completed: boolean;
        }> = [];

        // 1. Get campaigns with status 'sending'
        const { data: sendingCampaigns, error: campaignsError } = await supabase
            .from('ai_mass_campaigns')
            .select('*')
            .eq('status', 'sending')
            .order('created_at', { ascending: true });

        if (campaignsError) {
            console.error('Error fetching campaigns:', campaignsError);
            return NextResponse.json(
                { error: 'Failed to fetch campaigns', details: campaignsError.message },
                { status: 500 }
            );
        }

        if (!sendingCampaigns || sendingCampaigns.length === 0) {
            return NextResponse.json({
                success: true,
                processed: 0,
                message: 'No campaigns in sending status'
            });
        }

        // 2. Process each campaign
        for (const campaign of sendingCampaigns) {
            try {
                // Get pending recipients for this campaign
                const allRecipients = await getCampaignRecipients(campaign.id);
                const pendingRecipients = allRecipients.filter(r => r.status === 'pending');

                if (pendingRecipients.length === 0) {
                    // No pending recipients, check if campaign should be marked as completed
                    const sentCount = allRecipients.filter(r => r.status === 'sent').length;
                    const failedCount = allRecipients.filter(r => r.status === 'failed').length;
                    
                    // Update campaign stats
                    await updateCampaign(campaign.id, {
                        sent_count: sentCount,
                        failed_count: failedCount,
                        status: 'completed'
                    });

                    campaignResults.push({
                        campaign_id: campaign.id,
                        campaign_name: campaign.name,
                        processed: 0,
                        failed: 0,
                        completed: true
                    });
                    continue;
                }

                // Get shop's Twilio phone number
                const { data: phoneNumbers, error: phoneError } = await supabase
                    .from('twilio_phone_numbers')
                    .select('*')
                    .eq('shop_id', campaign.shop_id)
                    .eq('status', 'active')
                    .limit(1);

                if (phoneError || !phoneNumbers || phoneNumbers.length === 0) {
                    console.error(`No active phone number for shop ${campaign.shop_id}`);
                    errors.push(`Campaign ${campaign.name}: No active Twilio phone number`);
                    continue;
                }

                const shopPhoneNumber = phoneNumbers[0];

                // Get template
                const template = await getTemplate(campaign.template_id);
                if (!template) {
                    console.error(`Template ${campaign.template_id} not found for campaign ${campaign.id}`);
                    errors.push(`Campaign ${campaign.name}: Template not found`);
                    continue;
                }

                // Get shop info for variable replacement
                const { data: shop } = await supabase
                    .from('shops')
                    .select('shop_name, shop_phone, shop_address, shop_email')
                    .eq('id', campaign.shop_id)
                    .single();

                let campaignProcessed = 0;
                let campaignFailed = 0;

                // 3. Process recipients in batches (50 at a time, rate limited)
                for (let i = 0; i < pendingRecipients.length; i += BATCH_SIZE) {
                    // Check rate limit before processing batch
                    if (!checkRateLimit()) {
                        console.log('Rate limit reached, stopping processing');
                        break; // Stop processing this batch
                    }

                    const batch = pendingRecipients.slice(i, i + BATCH_SIZE);

                    // Process batch in parallel (but respect rate limit)
                    await Promise.all(
                        batch.map(async (recipient) => {
                            try {
                                // Check rate limit for each message
                                if (!checkRateLimit()) {
                                    throw new Error('Rate limit reached');
                                }

                                // Get customer data for variable replacement
                                const { data: customer, error: customerError } = await supabase
                                    .from('customers')
                                    .select(`
                                        *,
                                        customer_vehicles(*)
                                    `)
                                    .eq('id', recipient.customer_id)
                                    .single();

                                if (customerError || !customer) {
                                    throw new Error('Customer not found');
                                }

                                // Prepare data for variable replacement
                                const templateData = {
                                    customer: {
                                        customer_name: customer.customer_name || '',
                                        customer_phone: customer.customer_phone || '',
                                        customer_email: customer.customer_email || '',
                                        customer_address: customer.customer_address || ''
                                    },
                                    vehicle: customer.customer_vehicles?.[0] || {},
                                    shop: {
                                        shop_name: shop?.shop_name || '',
                                        shop_phone: shop?.shop_phone || shopPhoneNumber.phone_number,
                                        shop_address: shop?.shop_address || '',
                                        shop_email: shop?.shop_email || ''
                                    }
                                };

                                // Replace variables in template
                                const messageBody = replaceVariables(template.template, templateData, {
                                    missingVariableBehavior: 'empty'
                                });

                                // Format phone number
                                const formattedPhone = formatPhoneNumberE164(recipient.phone_number);

                                // Create or find customer
                                const { customerId, customer: foundCustomer } = await createOrFindCustomerByPhone(
                                    supabase,
                                    campaign.shop_id,
                                    formattedPhone,
                                    customer.customer_name
                                );

                                // 4. Send message via Twilio
                                const twilioMessage = await twilioClient.messages.create({
                                    to: formattedPhone,
                                    from: shopPhoneNumber.phone_number,
                                    body: messageBody,
                                });

                                // 5. Store message in sms_messages
                                const { data: storedMessage, error: messageError } = await supabase
                                    .from('sms_messages')
                                    .insert({
                                        shop_id: campaign.shop_id,
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

                                // 5. Update recipient status and link sms_message_id
                                await supabase
                                    .from('ai_mass_campaign_recipients')
                                    .update({
                                        status: 'sent',
                                        sent_at: new Date().toISOString(),
                                        sms_message_id: storedMessage?.id || twilioMessage.sid,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', recipient.id);

                                // Update sms_conversations
                                await supabase
                                    .from('sms_conversations')
                                    .upsert({
                                        shop_id: campaign.shop_id,
                                        customer_phone: formattedPhone,
                                        customer_id: customerId,
                                        last_message_at: new Date().toISOString(),
                                        customer_name: foundCustomer?.customer_name || null
                                    }, {
                                        onConflict: 'shop_id,customer_phone'
                                    });

                                campaignProcessed++;

                            } catch (error: any) {
                                console.error(`Error processing recipient ${recipient.id}:`, error);
                                
                                const errorMessage = error.message || error.toString() || 'Unknown error';
                                
                                // Mark recipient as failed
                                await supabase
                                    .from('ai_mass_campaign_recipients')
                                    .update({
                                        status: 'failed',
                                        error_message: errorMessage,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', recipient.id);

                                campaignFailed++;
                                errors.push(`Recipient ${recipient.id} (${campaign.name}): ${errorMessage}`);
                            }
                        })
                    );
                }

                // 6. Update campaign stats (sent_count, failed_count)
                const updatedRecipients = await getCampaignRecipients(campaign.id);
                const sentCount = updatedRecipients.filter(r => r.status === 'sent').length;
                const failedCount = updatedRecipients.filter(r => r.status === 'failed').length;
                const remainingPending = updatedRecipients.filter(r => r.status === 'pending').length;

                await updateCampaign(campaign.id, {
                    sent_count: sentCount,
                    failed_count: failedCount
                });

                // 7. Mark campaign as 'completed' when all sent
                if (remainingPending === 0) {
                    await updateCampaign(campaign.id, {
                        status: 'completed'
                    });
                }

                totalProcessed += campaignProcessed;
                totalFailed += campaignFailed;

                campaignResults.push({
                    campaign_id: campaign.id,
                    campaign_name: campaign.name,
                    processed: campaignProcessed,
                    failed: campaignFailed,
                    completed: remainingPending === 0
                });

            } catch (error: any) {
                console.error(`Error processing campaign ${campaign.id}:`, error);
                errors.push(`Campaign ${campaign.name}: ${error.message || 'Unknown error'}`);
            }
        }

        return NextResponse.json({
            success: true,
            processed: totalProcessed,
            failed: totalFailed,
            campaigns_processed: campaignResults.length,
            campaign_results: campaignResults,
            errors: errors.length > 0 ? errors : undefined,
            message: `Processed ${totalProcessed} messages, ${totalFailed} failed across ${campaignResults.length} campaign(s)`
        });

    } catch (error: any) {
        console.error('Error processing mass send campaigns:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}

