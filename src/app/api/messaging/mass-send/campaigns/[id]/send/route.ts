import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import {
    getCampaign,
    updateCampaign,
    generateRecipients
} from "@/app/(features)/messaging/lib/campaign-service";
import { getTemplate } from "@/app/(features)/messaging/lib/message-template-service";
import { replaceVariables } from "@/app/(features)/messaging/lib/variable-replacer";
import { addToQueue } from "@/app/(features)/messaging/lib/message-queue-service";
import { formatPhoneNumberE164 } from "@/utils/format-phone";
import { createClient } from "@/utils/supabase/server";

// POST - Start sending campaign
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get campaign
        const campaign = await getCampaign(params.id);
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        if (campaign.shop_id !== shopId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Validate campaign can be sent
        if (campaign.status === 'sending') {
            return NextResponse.json(
                { error: 'Campaign is already being sent' },
                { status: 400 }
            );
        }

        if (campaign.status === 'completed') {
            return NextResponse.json(
                { error: 'Campaign has already been completed' },
                { status: 400 }
            );
        }

        if (campaign.status === 'cancelled') {
            return NextResponse.json(
                { error: 'Cannot send a cancelled campaign' },
                { status: 400 }
            );
        }

        // Get template
        const template = await getTemplate(campaign.template_id);
        if (!template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        // 1. Generate recipients (create ai_mass_campaign_recipients entries)
        const recipients = await generateRecipients(params.id);

        if (recipients.length === 0) {
            return NextResponse.json(
                { error: 'No recipients found matching the segment criteria' },
                { status: 400 }
            );
        }

        // 2. Update campaign status to 'sending'
        await updateCampaign(params.id, {
            status: 'sending'
        });

        // 3. Create queue entries for each recipient
        const supabase = await createClient();
        const queueItems = [];
        const errors: string[] = [];

        // Get shop info for variable replacement
        const { data: shop } = await supabase
            .from('shops')
            .select('shop_name, shop_phone, shop_address, shop_email')
            .eq('id', shopId)
            .single();

        // Process recipients in batches to avoid overwhelming the system
        const batchSize = 50;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            await Promise.all(
                batch.map(async (recipient) => {
                    try {
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
                                shop_phone: shop?.shop_phone || '',
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

                        // Create queue entry
                        const queueItem = await addToQueue({
                            shop_id: shopId,
                            template_id: campaign.template_id,
                            customer_id: recipient.customer_id,
                            phone_number: formattedPhone,
                            message_body: messageBody,
                            scheduled_send_at: campaign.scheduled_send_at || new Date().toISOString(),
                            status: 'pending'
                        });

                        queueItems.push(queueItem);

                    } catch (error: any) {
                        console.error(`Error creating queue item for recipient ${recipient.id}:`, error);
                        errors.push(`Recipient ${recipient.id}: ${error.message || 'Unknown error'}`);

                        // Mark recipient as failed
                        await supabase
                            .from('ai_mass_campaign_recipients')
                            .update({
                                status: 'failed',
                                error_message: error.message || 'Unknown error',
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', recipient.id);
                    }
                })
            );
        }

        return NextResponse.json({
            success: true,
            message: `Campaign started. ${queueItems.length} messages queued.`,
            recipients_queued: queueItems.length,
            total_recipients: recipients.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error sending campaign:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

