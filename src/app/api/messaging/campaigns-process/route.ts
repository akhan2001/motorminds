import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { formatPhoneNumberE164, isValidE164 } from '@/utils/format-phone'
import { replaceVariables } from '@/app/(features)/messaging/lib/variable-replacer'

// Use service role client to bypass RLS (this endpoint may be called by cron jobs)
const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    : null

// Initialize Twilio client
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN

if (!twilioAccountSid || !twilioAuthToken) {
    console.warn('⚠️ Twilio credentials not configured. Campaign SMS sending will fail.')
}

const twilioClient = twilioAccountSid && twilioAuthToken 
    ? twilio(twilioAccountSid, twilioAuthToken)
    : null

// Rate limiter: 100 messages per minute (Twilio limit)
const RATE_LIMIT = 100
const RATE_WINDOW_MS = 60000 // 1 minute

let messageCount = 0
let windowStart = Date.now()

function checkRateLimit(): boolean {
    const now = Date.now()
    
    // Reset window if a minute has passed
    if (now - windowStart >= RATE_WINDOW_MS) {
        messageCount = 0
        windowStart = now
    }
    
    // Check if we've hit the limit
    if (messageCount >= RATE_LIMIT) {
        return false
    }
    
    messageCount++
    return true
}

export async function POST(request: NextRequest) {
    try {
        // Optional: Check for authorization header (for cron jobs)
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET
        
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            // Allow manual triggers without auth, but require auth for cron
            const isManualTrigger = !authHeader
            if (!isManualTrigger) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        }

        if (!supabase) {
            return NextResponse.json(
                { error: 'Service role key not configured' },
                { status: 500 }
            )
        }

        if (!twilioClient) {
            return NextResponse.json(
                { error: 'Twilio not configured' },
                { status: 500 }
            )
        }

        const now = new Date().toISOString()

        // Find campaigns ready to send
        const { data: campaigns, error: campaignsError } = await supabase
            .from('ai_mass_campaigns')
            .select('*')
            .in('status', ['scheduled', 'in_progress'])
            .or(`scheduled_send_at.is.null,scheduled_send_at.lte.${now}`)
            .limit(10)

        if (campaignsError) {
            console.error('Error fetching campaigns:', campaignsError)
            return NextResponse.json(
                { error: 'Failed to fetch campaigns', details: campaignsError.message },
                { status: 500 }
            )
        }

        console.log(`📬 Found ${campaigns?.length || 0} campaigns to process`)

        if (!campaigns || campaigns.length === 0) {
            return NextResponse.json({
                success: true,
                processed_campaigns: 0,
                message: 'No campaigns to process'
            })
        }

        let processedCampaigns = 0
        let totalSent = 0
        let totalFailed = 0
        const errors: string[] = []

        // Process each campaign
        for (const campaign of campaigns) {
            try {
                console.log(`📤 Processing campaign: ${campaign.name} (${campaign.id})`)

                // Update status to in_progress if not already
                if (campaign.status !== 'in_progress') {
                    await supabase
                        .from('ai_mass_campaigns')
                        .update({ status: 'in_progress' })
                        .eq('id', campaign.id)
                }

                // Get shop's Twilio phone number
                const { data: phoneNumbers, error: phoneError } = await supabase
                    .from('twilio_phone_numbers')
                    .select('*')
                    .eq('shop_id', campaign.shop_id)
                    .eq('status', 'active')
                    .limit(1)

                if (phoneError || !phoneNumbers || phoneNumbers.length === 0) {
                    console.error(`❌ No active phone number for shop ${campaign.shop_id}`)
                    await supabase
                        .from('ai_mass_campaigns')
                        .update({ 
                            status: 'failed',
                            completed_at: new Date().toISOString()
                        })
                        .eq('id', campaign.id)
                    errors.push(`Campaign ${campaign.name}: No active Twilio phone number`)
                    continue
                }

                const shopPhoneNumber = phoneNumbers[0]

                // Get pending recipients (batch of 50) with customer and vehicle data
                const { data: recipients, error: recipientsError } = await supabase
                    .from('ai_mass_campaign_recipients')
                    .select(`
                        *,
                        customer:customers(
                            id,
                            customer_name,
                            customer_phone,
                            customer_email,
                            customer_vehicles(
                                make,
                                model,
                                year
                            )
                        )
                    `)
                    .eq('campaign_id', campaign.id)
                    .eq('status', 'pending')
                    .limit(50)

                if (recipientsError) {
                    console.error('Error fetching recipients:', recipientsError)
                    continue
                }

                if (!recipients || recipients.length === 0) {
                    // Check if campaign is complete
                    const { count: pendingCount } = await supabase
                        .from('ai_mass_campaign_recipients')
                        .select('*', { count: 'exact', head: true })
                        .eq('campaign_id', campaign.id)
                        .eq('status', 'pending')

                    if (pendingCount === 0) {
                        // Mark campaign as completed
                        await supabase
                            .from('ai_mass_campaigns')
                            .update({ 
                                status: 'completed',
                                completed_at: new Date().toISOString()
                            })
                            .eq('id', campaign.id)
                        
                        console.log(`✅ Campaign ${campaign.name} completed`)
                    }
                    continue
                }

                // Get shop info for variable replacement
                const { data: shop } = await supabase
                    .from('shops')
                    .select('shop_name, shop_phone, shop_address')
                    .eq('id', campaign.shop_id)
                    .single()

                // Process recipients
                for (const recipient of recipients) {
                    try {
                        // Check rate limit
                        if (!checkRateLimit()) {
                            console.log('⏸️  Rate limit reached, stopping processing')
                            break
                        }

                        // Generate message with variable replacement
                        const customer = (recipient as any).customer
                        if (!customer) {
                            console.error(`❌ Customer not found for recipient ${recipient.id}`)
                            await supabase
                                .from('ai_mass_campaign_recipients')
                                .update({
                                    status: 'failed',
                                    error_message: 'Customer not found',
                                    retry_count: (recipient.retry_count || 0) + 1
                                })
                                .eq('id', recipient.id)
                            totalFailed++
                            continue
                        }

                        // Prepare template data
                        const templateData: any = {
                            customer_name: customer.customer_name,
                            shop_name: shop?.shop_name || 'Your Auto Shop',
                            shop_phone: shop?.shop_phone || '',
                            customer: {
                                customer_name: customer.customer_name,
                                customer_phone: customer.customer_phone,
                                customer_email: customer.customer_email
                            },
                            shop: {
                                shop_name: shop?.shop_name || 'Your Auto Shop',
                                shop_phone: shop?.shop_phone || '',
                                shop_address: shop?.shop_address || ''
                            },
                            vehicle: null as any
                        }

                        // Add vehicle data if available
                        if (customer.customer_vehicles && customer.customer_vehicles.length > 0) {
                            const vehicle = customer.customer_vehicles[0]
                            templateData.vehicle = {
                                make: vehicle.make || '',
                                model: vehicle.model || '',
                                year: vehicle.year?.toString() || ''
                            }
                            templateData.vehicle_make = vehicle.make || ''
                            templateData.vehicle_model = vehicle.model || ''
                            templateData.vehicle_year = vehicle.year?.toString() || ''
                        }

                        // Replace variables in message
                        const messageBody = replaceVariables(campaign.message, templateData, {
                            missingVariableBehavior: 'empty'
                        })

                        // Validate and format phone number
                        const rawPhone = recipient.customer_phone || ''
                        
                        // Check for invalid characters (like XXXX in test numbers)
                        if (rawPhone.toUpperCase().includes('X') || rawPhone.includes('*') || rawPhone.length < 10) {
                            console.warn(`⚠️ [PROCESS] Invalid phone number format: ${rawPhone} (contains invalid characters or too short)`)
                            await supabase
                                .from('ai_mass_campaign_recipients')
                                .update({
                                    status: 'failed',
                                    error_message: `Invalid phone number format: ${rawPhone}`,
                                    retry_count: (recipient.retry_count || 0) + 1
                                })
                                .eq('id', recipient.id)
                            totalFailed++
                            continue
                        }

                        // Format phone number
                        const formattedPhone = formatPhoneNumberE164(rawPhone)
                        
                        // Validate E.164 format
                        if (!isValidE164(formattedPhone)) {
                            console.warn(`⚠️ [PROCESS] Invalid E.164 format: ${formattedPhone} (from ${rawPhone})`)
                            await supabase
                                .from('ai_mass_campaign_recipients')
                                .update({
                                    status: 'failed',
                                    error_message: `Invalid phone number format: ${rawPhone}`,
                                    retry_count: (recipient.retry_count || 0) + 1
                                })
                                .eq('id', recipient.id)
                            totalFailed++
                            continue
                        }

                        console.log(`📱 [PROCESS] Sending to ${formattedPhone} (from ${rawPhone})`)

                        // Send via Twilio
                        const twilioMessage = await twilioClient.messages.create({
                            to: formattedPhone,
                            from: shopPhoneNumber.phone_number,
                            body: messageBody
                        })

                        // Store in sms_messages
                        const { data: smsMessage } = await supabase
                            .from('sms_messages')
                            .insert({
                                shop_id: campaign.shop_id,
                                customer_id: recipient.customer_id,
                                from_number: shopPhoneNumber.phone_number,
                                to_number: formattedPhone,
                                message_body: messageBody,
                                direction: 'outbound',
                                status: 'sent',
                                twilio_sid: twilioMessage.sid,
                                sent_at: new Date().toISOString()
                            })
                            .select()
                            .single()

                        // Update recipient status
                        await supabase
                            .from('ai_mass_campaign_recipients')
                            .update({
                                status: 'sent',
                                sent_at: new Date().toISOString(),
                                sms_message_id: smsMessage?.id || null
                            })
                            .eq('id', recipient.id)

                        totalSent++

                    } catch (recipientError: any) {
                        console.error(`Error sending to recipient ${recipient.id}:`, recipientError)
                        
                        // Update recipient as failed
                        await supabase
                            .from('ai_mass_campaign_recipients')
                            .update({
                                status: 'failed',
                                error_message: recipientError.message || 'Unknown error',
                                retry_count: recipient.retry_count + 1
                            })
                            .eq('id', recipient.id)

                        totalFailed++
                    }
                }

                // Update campaign counts
                const { data: counts } = await supabase
                    .from('ai_mass_campaign_recipients')
                    .select('status')
                    .eq('campaign_id', campaign.id)

                const sentCount = counts?.filter(r => r.status === 'sent').length || 0
                const failedCount = counts?.filter(r => r.status === 'failed').length || 0

                await supabase
                    .from('ai_mass_campaigns')
                    .update({
                        sent_count: sentCount,
                        failed_count: failedCount
                    })
                    .eq('id', campaign.id)

                processedCampaigns++

            } catch (campaignError: any) {
                console.error(`Error processing campaign ${campaign.id}:`, campaignError)
                errors.push(`Campaign ${campaign.name}: ${campaignError.message}`)
            }
        }

        return NextResponse.json({
            success: true,
            processed_campaigns: processedCampaigns,
            total_sent: totalSent,
            total_failed: totalFailed,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error: any) {
        console.error('Error in campaign processing:', error)
        return NextResponse.json(
            { error: 'Failed to process campaigns', details: error.message },
            { status: 500 }
        )
    }
}

