import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        const supabase = await createClient();
        let query = supabase
            .from('appointments')
            .select(`
                *,
                customer:customers(*),
                vehicle:customer_vehicles(*),
                repair_orders(*)
            `)
            .eq('shop_id', shopId)
            .order('appointment_date', { ascending: true });

        if (startDate && endDate) {
            query = query
                .gte('appointment_date', startDate)
                .lte('appointment_date', endDate);
        }

        const { data: appointments, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(appointments);

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        
        const {
            customer_id,
            vehicle_id,
            appointment_date,
            start_time,
            end_time,
            service_type,
            notes,
            created_by_customer = false,
            customer_type = 'registered',
            walk_in_vehicle_info
        } = body;

        // Validate required fields based on customer type
        if (!appointment_date || !start_time || !end_time || !service_type) {
            return NextResponse.json({ 
                error: 'Missing required fields',
                missing: {
                    appointment_date: !appointment_date,
                    start_time: !start_time,
                    end_time: !end_time,
                    service_type: !service_type
                }
            }, { status: 400 });
        }

        // Validate based on customer type
        if (customer_type === 'registered') {
            if (!customer_id || !vehicle_id) {
                return NextResponse.json({ 
                    error: 'Missing required fields for registered customer',
                    missing: {
                        customer_id: !customer_id,
                        vehicle_id: !vehicle_id
                    }
                }, { status: 400 });
            }
        } else if (customer_type === 'walk_in') {
            if (!walk_in_vehicle_info) {
                return NextResponse.json({ 
                    error: 'Missing walk_in_vehicle_info for walk-in appointment'
                }, { status: 400 });
            }
            // Validate walk-in vehicle info
            if (!walk_in_vehicle_info.year || !walk_in_vehicle_info.make || 
                !walk_in_vehicle_info.model || !walk_in_vehicle_info.license_plate) {
                return NextResponse.json({ 
                    error: 'Year, make, model, and license plate are required for walk-in vehicles'
                }, { status: 400 });
            }
        }

        const supabase = await createClient();

        // Create appointment
        const appointmentData = {
            shop_id: shopId,
            customer_id: customer_type === 'walk_in' ? null : customer_id,
            vehicle_id: customer_type === 'walk_in' ? (vehicle_id || null) : vehicle_id,
            appointment_date,
            start_time,
            end_time,
            service_type,
            notes,
            created_by_customer,
            customer_type,
            walk_in_vehicle_info: customer_type === 'walk_in' ? walk_in_vehicle_info : null,
            confirmation_code: generateConfirmationCode()
        };
        
        const { data: appointment, error: appointmentError } = await supabase
            .from('appointments')
            .insert(appointmentData)
            .select()
            .single();

        if (appointmentError) {
            console.error('Appointment creation error:', appointmentError);
            return NextResponse.json({ 
                error: appointmentError.message,
                details: appointmentError.details,
                hint: appointmentError.hint,
                code: appointmentError.code
            }, { status: 500 });
        }

        // Auto-generate repair order only for registered customers
        let repairOrder = null;
        if (customer_type === 'registered' && customer_id && vehicle_id) {
            const orderNumber = `RO-${Date.now()}`;
            const repairOrderData = {
                shop_id: shopId,
                customer_id,
                vehicle_id,
                appointment_id: appointment.id,
                order_number: orderNumber,
                status: 'pending',
                total_cost: 0
            };
            
            const { data: createdRepairOrder, error: repairOrderError } = await supabase
                .from('repair_orders')
                .insert(repairOrderData)
                .select()
                .single();

            if (repairOrderError) {
                console.error('Failed to create repair order:', repairOrderError);
                // Don't fail the entire request if repair order creation fails
                // The appointment was created successfully
            } else {
                repairOrder = createdRepairOrder;
            }
        }

        // Send real-time notification
        try {
            await supabase
                .channel('appointments')
                .send({
                    type: 'broadcast',
                    event: 'appointment_created',
                    payload: { appointment, repairOrder, shopId }
                });
        } catch (notificationError) {
            console.error('Failed to send real-time notification:', notificationError);
            // Don't fail the request if notification fails
        }

        return NextResponse.json({ appointment, repairOrder });

    } catch (error) {
        console.error('Appointment creation API error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

function generateConfirmationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
