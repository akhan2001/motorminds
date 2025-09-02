import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getShopIdForUser } from '@/utils/get-shop-id';
import { sendAppointmentSMSConfirmation } from '@/lib/sms/send-appointment-confirmation';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ appointmentId: string }> }
) {
    try {
        const { appointmentId } = await params;
        const supabase = await createClient();
        const shopId = await getShopIdForUser();

        if (!shopId) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 403 });
        }

        // Get appointment with customer and vehicle details
        const { data: appointment, error: appointmentError } = await supabase
            .from('appointments')
            .select(`
                *,
                customer:customers(*),
                vehicle:customer_vehicles(*)
            `)
            .eq('id', appointmentId)
            .eq('shop_id', shopId)
            .single();

        if (appointmentError || !appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Get shop details
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('*')
            .eq('id', shopId)
            .single();

        if (shopError || !shop) {
            return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Check if customer has phone number
        if (!appointment.customer?.customer_phone) {
            return NextResponse.json({ 
                error: 'Customer phone number is required to send SMS' 
            }, { status: 400 });
        }

        // Create service role client for SMS operations
        const serviceSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        console.log('Attempting to send SMS confirmation for appointment:', {
            appointmentId: appointment.id,
            customerPhone: appointment.customer?.customer_phone,
            shopId: shop.id,
            shopName: shop.shop_name
        });

        // Send SMS confirmation
        const result = await sendAppointmentSMSConfirmation({
            appointment,
            customer: appointment.customer,
            vehicle: appointment.vehicle,
            shop,
            supabase: serviceSupabase
        });

        console.log('SMS confirmation result:', result);

        return NextResponse.json({ 
            success: true, 
            message: 'SMS confirmation sent successfully' 
        });

    } catch (error) {
        console.error('Error sending SMS confirmation:', error);
        return NextResponse.json({ 
            error: 'Failed to send SMS confirmation' 
        }, { status: 500 });
    }
}
