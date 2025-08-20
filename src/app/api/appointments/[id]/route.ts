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

        // Delete appointment (repair orders will cascade if set up)
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id)
            .eq('shop_id', shopId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Send real-time notification
        await supabase
            .channel('appointments')
            .send({
                type: 'broadcast',
                event: 'appointment_deleted',
                payload: { appointmentId: id, shopId }
            });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
