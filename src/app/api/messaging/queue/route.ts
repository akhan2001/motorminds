import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { replaceVariables } from "@/app/(features)/messaging/lib/variable-replacer";

// GET - List queue items (with filters: status, date range)
export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const limit = parseInt(searchParams.get('limit') || '100');

        const supabase = await createClient();

        // Build query with joins to get customer and template info
        let query = supabase
            .from('ai_message_queue')
            .select(`
                *,
                customer:customers(customer_name, customer_phone),
                template:ai_message_templates(name, message_template)
            `)
            .eq('shop_id', shopId)
            .order('scheduled_send_at', { ascending: false })
            .limit(limit);

        // Apply status filter
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Apply date range filters
        if (startDate) {
            query = query.gte('scheduled_send_at', startDate);
        }
        if (endDate) {
            query = query.lte('scheduled_send_at', endDate);
        }

        const { data: queueItems, error } = await query;

        if (error) {
            console.error('Error fetching queue items:', error);
            return NextResponse.json(
                { error: 'Failed to fetch queue items', details: error.message },
                { status: 500 }
            );
        }

        // Enrich queue items with generated message body
        const enrichedItems = await Promise.all((queueItems || []).map(async (item: any) => {
            let messageBody = '';
            
            // Generate message body from template if available
            if (item.template?.message_template && item.trigger_data) {
                try {
                    // Fetch work order details if needed for variable replacement
                    const { data: workOrder } = await supabase
                        .from('work_orders')
                        .select(`
                            *,
                            customer:customers(*),
                            vehicle:customer_vehicles(*),
                            shop:shops(*)
                        `)
                        .eq('id', item.trigger_data.work_order_id)
                        .single();

                    if (workOrder) {
                        const vehicle = workOrder.vehicle;
                        // Support both flat (vehicle_make) and nested (vehicle.make) syntax
                        const templateData: any = {
                            // Flat syntax (for backward compatibility)
                            customer_name: workOrder.customer?.customer_name || 'Customer',
                            shop_name: workOrder.shop?.shop_name || 'Your Auto Shop',
                            shop_phone: workOrder.shop?.shop_phone || '',
                            vehicle_make: vehicle?.make || '',
                            vehicle_model: vehicle?.model || '',
                            vehicle_year: vehicle?.year?.toString() || '',
                            vehicle_info: vehicle 
                                ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim()
                                : '',
                            work_order_title: workOrder.title || '',
                            service_type: item.trigger_data.service_type || workOrder.title || '',
                            // Nested syntax (for [vehicle.make] style templates)
                            vehicle: vehicle ? {
                                make: vehicle.make || '',
                                model: vehicle.model || '',
                                year: vehicle.year?.toString() || '',
                                license_plate: vehicle.license_plate || '',
                                vin: vehicle.vin || ''
                            } : null,
                            customer: {
                                customer_name: workOrder.customer?.customer_name || 'Customer',
                                customer_phone: workOrder.customer?.customer_phone || '',
                                customer_email: workOrder.customer?.customer_email || ''
                            },
                            shop: {
                                shop_name: workOrder.shop?.shop_name || 'Your Auto Shop',
                                shop_phone: workOrder.shop?.shop_phone || '',
                                shop_address: workOrder.shop?.shop_address || ''
                            },
                            work_order: {
                                title: workOrder.title || '',
                                work_order_number: workOrder.work_order_number || ''
                            }
                        };

                        messageBody = replaceVariables(item.template.message_template, templateData, {
                            missingVariableBehavior: 'empty'
                        });
                    }
                } catch (err) {
                    console.error('Error generating message body:', err);
                    messageBody = item.template.message_template; // Fallback to template without replacement
                }
            }

            return {
                ...item,
                phone_number: item.customer?.customer_phone || 'N/A',
                message_body: messageBody || 'Message template not found'
            };
        }));

        return NextResponse.json({
            items: enrichedItems,
            count: enrichedItems.length
        });

    } catch (error) {
        console.error('Error fetching message queue:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
