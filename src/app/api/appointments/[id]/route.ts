import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();
        const { data: appointment, error } = await supabase
            .from('appointments')
            .select(`
                *,
                customer:customers(*),
                vehicle:customer_vehicles(*),
                repair_orders(*)
            `)
            .eq('id', id)
            .eq('shop_id', shopId)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        return NextResponse.json(appointment);

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            appointment_date,
            start_time,
            end_time,
            service_type,
            notes,
            status
        } = body;

        const supabase = await createClient();

        // Update appointment
        const { data: appointment, error: appointmentError } = await supabase
            .from('appointments')
            .update({
                appointment_date,
                start_time,
                end_time,
                service_type,
                notes,
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('shop_id', shopId)
            .select(`
                *,
                customer:customers(*),
                vehicle:customer_vehicles(*)
            `)
            .single();

        if (appointmentError) {
            return NextResponse.json({ error: appointmentError.message }, { status: 500 });
        }

        // Send real-time notification
        await supabase
            .channel('appointments')
            .send({
                type: 'broadcast',
                event: 'appointment_updated',
                payload: { appointment, shopId }
            });

        return NextResponse.json(appointment);

    } catch (error) {
        console.error('Appointment PUT API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();

        // First, check if appointment exists and belongs to this shop
        const { data: existingAppointment, error: fetchError } = await supabase
            .from('appointments')
            .select('id')
            .eq('id', id)
            .eq('shop_id', shopId)
            .single();

        if (fetchError) {
            console.error('Error fetching appointment for deletion:', fetchError);
            return NextResponse.json({ error: 'Failed to verify appointment' }, { status: 500 });
        }

        if (!existingAppointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Delete related repair_order_details first (if any)
        const { error: detailsDeleteError } = await supabase
            .from('repair_order_details')
            .delete()
            .eq('appointment_id', id);

        if (detailsDeleteError) {
            console.error('Error deleting repair order details:', detailsDeleteError);
        }

        // Delete related repair_orders
        const { error: repairOrderDeleteError } = await supabase
            .from('repair_orders')
            .delete()
            .eq('appointment_id', id);

        if (repairOrderDeleteError) {
            console.error('Error deleting repair orders:', repairOrderDeleteError);
        }

        // Now delete the appointment
        const { error: appointmentDeleteError } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id)
            .eq('shop_id', shopId);

        if (appointmentDeleteError) {
            console.error('Error deleting appointment:', appointmentDeleteError);
            return NextResponse.json({ 
                error: appointmentDeleteError.message,
                details: appointmentDeleteError.details,
                hint: appointmentDeleteError.hint,
                code: appointmentDeleteError.code
            }, { status: 500 });
        }

        // Send real-time notification (don't fail if this fails)
        try {
            await supabase
                .channel('appointments')
                .send({
                    type: 'broadcast',
                    event: 'appointment_deleted',
                    payload: { appointmentId: id, shopId }
                });
        } catch (notificationError) {
            console.error('Failed to send real-time notification:', notificationError);
            // Don't fail the request if notification fails
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Appointment deletion API error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
