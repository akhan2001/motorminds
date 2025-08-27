import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/utils/supabase/server';
import { generateAppointmentConfirmationEmail } from '@/lib/email-templates/appointment-confirmation';
import { getShopIdForUser } from '@/utils/get-shop-id';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const resend = new Resend(RESEND_API_KEY);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ appointmentId: string }> }
) {
    try {
        const { appointmentId } = await params;
        
        if (!appointmentId) {
            return NextResponse.json(
                { error: 'Appointment ID is required' },
                { status: 400 }
            );
        }
        
        // Verify user has access to this appointment
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        
        const supabase = await createClient();
        
        // Fetch complete appointment details with related data
        const { data: appointment, error: appointmentError } = await supabase
            .from('appointments')
            .select(`
                *,
                customer:customers(*),
                vehicle:customer_vehicles(*),
                shop:shops(*)
            `)
            .eq('id', appointmentId)
            .eq('shop_id', shopId)
            .single();
        
        if (appointmentError || !appointment) {
            console.error('Appointment fetch error:', appointmentError);
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }
        
        // Check if customer has email
        const customerEmail = appointment.customer?.customer_email || appointment.customer?.email;
        if (!customerEmail) {
            return NextResponse.json(
                { error: 'Customer email is required to send appointment confirmation' },
                { status: 400 }
            );
        }
        
        // Generate email content
        const emailData = {
            appointment: {
                id: appointment.id,
                appointment_date: appointment.appointment_date,
                start_time: appointment.start_time,
                end_time: appointment.end_time,
                service_type: appointment.service_type,
                confirmation_code: appointment.confirmation_code,
                notes: appointment.notes,
                status: appointment.status
            },
            customer: appointment.customer,
            vehicle: appointment.vehicle,
            shop: appointment.shop
        };
        
        const { subject, html } = generateAppointmentConfirmationEmail(emailData);
        
        // Create shop-specific email domain: [shopName]@motorminds.ca
        const shopNameClean = appointment.shop.shop_name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
            .substring(0, 20); // Limit length for email compatibility
        
        const fromEmail = `${shopNameClean}@motorminds.ca`;
        
        // Send email using Resend
        const { data, error } = await resend.emails.send({
            from: `${appointment.shop.shop_name} <${fromEmail}>`,
            to: [customerEmail],
            subject: subject,
            html: html
        });
        
        if (error) {
            console.error('Email sending error:', error);
            return NextResponse.json(
                { error: 'Failed to send appointment confirmation email' },
                { status: 500 }
            );
        }
        
        // Update appointment status to indicate confirmation was sent
        const { error: updateError } = await supabase
            .from('appointments')
            .update({ 
                status: 'confirmed',
                updated_at: new Date().toISOString()
            })
            .eq('id', appointmentId);
        
        if (updateError) {
            console.error('Failed to update appointment status:', updateError);
            // Don't fail the request if status update fails
        }
        
        return NextResponse.json({
            success: true,
            message: 'Appointment confirmation sent successfully',
            emailId: data?.id
        }, { status: 200 });
        
    } catch (error) {
        console.error('Error sending appointment confirmation:', error);
        
        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }
        
        return NextResponse.json(
            { error: 'Failed to send appointment confirmation' },
            { status: 500 }
        );
    }
}

// Handle preflight CORS requests
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
