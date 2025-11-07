import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTemplatesByTrigger } from "@/app/(features)/messaging/lib/message-template-service";
import { addToQueue } from "@/app/(features)/messaging/lib/message-queue-service";
import { replaceVariables } from "@/app/(features)/messaging/lib/variable-replacer";
import { WorkOrderService } from "@/app/(features)/operations/lib/work-order-service";

// POST - Webhook called when work order completes
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { work_order_id } = body;

        if (!work_order_id) {
            return NextResponse.json(
                { error: 'Missing required field: work_order_id' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const workOrderService = new WorkOrderService();

        // 1. Get work order data with customer, vehicle, and shop details
        const workOrder = await workOrderService.getWorkOrderWithDetailsById(work_order_id);

        if (!workOrder) {
            return NextResponse.json(
                { error: 'Work order not found' },
                { status: 404 }
            );
        }

        // Verify work order is completed
        if (workOrder.status !== 'completed') {
            return NextResponse.json(
                { error: 'Work order is not completed', status: workOrder.status },
                { status: 400 }
            );
        }

        // Get customer phone number
        const customer = Array.isArray(workOrder.customer) ? workOrder.customer[0] : workOrder.customer;
        if (!customer || !customer.customer_phone) {
            return NextResponse.json(
                { error: 'Customer phone number not found' },
                { status: 400 }
            );
        }

        // Get shop information
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('shop_name, shop_phone, shop_address, shop_email')
            .eq('id', workOrder.shop_id)
            .single();

        if (shopError || !shop) {
            console.error('Error fetching shop:', shopError);
            return NextResponse.json(
                { error: 'Shop not found' },
                { status: 404 }
            );
        }

        // Get vehicle data
        const vehicle = Array.isArray(workOrder.vehicle) ? workOrder.vehicle[0] : workOrder.vehicle;

        // Calculate total amount (if available from invoice or work order items)
        let totalAmount = 0;
        if (workOrder.total_amount) {
            totalAmount = workOrder.total_amount;
        } else {
            // Try to get from work order items
            const { data: items } = await supabase
                .from('work_order_items')
                .select('total_price')
                .eq('work_order_id', work_order_id);

            if (items) {
                totalAmount = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
            }
        }

        // 2. Find matching templates (trigger_type = 'work_order_completed')
        const templates = await getTemplatesByTrigger(workOrder.shop_id, 'work_order_completed');

        if (templates.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No active templates found for work_order_completed trigger',
                queueItemsCreated: 0
            });
        }

        // 3. Create queue entries for each template
        const queueItems = [];
        const errors: string[] = [];

        for (const template of templates) {
            try {
                // Prepare data for variable replacement
                const templateData = {
                    customer: {
                        customer_name: customer.customer_name || '',
                        customer_phone: customer.customer_phone || '',
                        customer_email: customer.customer_email || '',
                        customer_address: customer.customer_address || ''
                    },
                    vehicle: vehicle ? {
                        year: vehicle.year || '',
                        make: vehicle.make || '',
                        model: vehicle.model || '',
                        license_plate: vehicle.license_plate || '',
                        vin: vehicle.vin || '',
                        mileage: vehicle.mileage || '',
                        color: vehicle.color || ''
                    } : {},
                    work_order: {
                        work_order_number: workOrder.work_order_number || '',
                        title: workOrder.title || '',
                        status: workOrder.status || '',
                        completed_at: workOrder.completed_at || new Date().toISOString(),
                        total_amount: totalAmount
                    },
                    shop: {
                        shop_name: shop.shop_name || '',
                        shop_phone: shop.shop_phone || '',
                        shop_address: shop.shop_address || '',
                        shop_email: shop.shop_email || ''
                    },
                    service: {
                        service_type: workOrder.title || 'Service',
                        service_date: workOrder.completed_at || new Date().toISOString(),
                        service_amount: totalAmount
                    }
                };

                // Replace variables in template
                const messageBody = replaceVariables(template.template, templateData, {
                    missingVariableBehavior: 'empty'
                });

                // Format phone number (ensure +1 format)
                const formattedPhone = customer.customer_phone.startsWith('+')
                    ? customer.customer_phone
                    : `+1${customer.customer_phone.replace(/^1/, '')}`;

                // Create queue entry
                const queueItem = await addToQueue({
                    shop_id: workOrder.shop_id,
                    template_id: template.id,
                    customer_id: customer.id,
                    phone_number: formattedPhone,
                    message_body: messageBody,
                    scheduled_send_at: new Date().toISOString(), // Send immediately
                    status: 'pending'
                });

                queueItems.push(queueItem);

            } catch (error: any) {
                console.error(`Error creating queue item for template ${template.id}:`, error);
                errors.push(`Template ${template.name}: ${error.message || 'Unknown error'}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Created ${queueItems.length} queue item(s) for work order completion`,
            queueItemsCreated: queueItems.length,
            queueItems: queueItems.map(item => ({ id: item.id, template_id: item.template_id })),
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('Error processing work order completed trigger:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}

