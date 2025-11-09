import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { getActiveTemplatesByTrigger } from "@/app/(features)/messaging/lib/message-template-service";
import { addToQueue } from "@/app/(features)/messaging/lib/message-queue-service";
import { replaceVariables } from "@/app/(features)/messaging/lib/variable-replacer";
import type { ServiceType } from "@/app/(features)/messaging/types/message-template";

// POST - Queue automated follow-up messages based on active templates
export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { work_order_id, customer_id, service_type } = body;

        if (!work_order_id || !customer_id) {
            return NextResponse.json(
                { error: 'Missing required fields: work_order_id, customer_id' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Get work order details with customer, vehicle, and shop info
        const { data: workOrder, error: woError } = await supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(*),
                vehicle:vehicles(*),
                shop:shops(*)
            `)
            .eq('id', work_order_id)
            .single();

        if (woError || !workOrder) {
            return NextResponse.json(
                { error: 'Work order not found' },
                { status: 404 }
            );
        }

        // Check if customer has phone number
        if (!workOrder.customer?.customer_phone) {
            return NextResponse.json({
                success: true,
                queued: 0,
                message: 'No customer phone number available'
            });
        }

        // Get active templates for work_order_complete trigger with optional service type filtering
        const templates = await getActiveTemplatesByTrigger(
            shopId, 
            'work_order_complete',
            service_type as ServiceType || undefined
        );

        if (templates.length === 0) {
            return NextResponse.json({
                success: true,
                queued: 0,
                message: 'No active templates found for this trigger'
            });
        }

        let queuedCount = 0;

        // Queue a message for each matching template
        for (const template of templates) {
            try {
                // Calculate scheduled send time (delay_hours from now)
                const scheduledDate = new Date();
                scheduledDate.setHours(scheduledDate.getHours() + template.delay_hours);

                // Prepare data for variable replacement
                const templateData = {
                    customer_name: workOrder.customer?.customer_name || 'Customer',
                    shop_name: workOrder.shop?.shop_name || 'Your Auto Shop',
                    shop_phone: workOrder.shop?.shop_phone || '',
                    vehicle_make: workOrder.vehicle?.make || '',
                    vehicle_model: workOrder.vehicle?.model || '',
                    vehicle_year: workOrder.vehicle?.year || '',
                    vehicle_info: workOrder.vehicle 
                        ? `${workOrder.vehicle.year} ${workOrder.vehicle.make} ${workOrder.vehicle.model}`.trim()
                        : '',
                    work_order_title: workOrder.title || '',
                    service_type: service_type || workOrder.title || '',
                    delay_time: formatDelayTime(template.delay_hours)
                };

                // Replace variables in template
                const messageBody = replaceVariables(template.message_template, templateData, {
                    missingVariableBehavior: 'empty'
                });

                // Add to queue
                await addToQueue({
                    shop_id: shopId,
                    template_id: template.id,
                    customer_id: customer_id,
                    trigger_event: 'work_order_complete',
                    trigger_data: {
                        work_order_id,
                        service_type: service_type || null,
                        vehicle_id: workOrder.vehicle_id,
                        completed_at: new Date().toISOString()
                    },
                    scheduled_send_at: scheduledDate.toISOString(),
                    status: 'pending',
                    retry_count: 0
                });

                queuedCount++;
            } catch (error) {
                console.error(`Error queuing message for template ${template.id}:`, error);
                // Continue with other templates even if one fails
            }
        }

        return NextResponse.json({
            success: true,
            queued: queuedCount,
            templates: templates.length,
            message: `Queued ${queuedCount} automated message(s)`
        });

    } catch (error: any) {
        console.error('Error queuing automated messages:', error);
        return NextResponse.json(
            {
                error: 'Failed to queue automated messages',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
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

