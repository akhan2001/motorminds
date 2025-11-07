import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTemplatesByTrigger } from "@/app/(features)/messaging/lib/message-template-service";
import { addToQueue } from "@/app/(features)/messaging/lib/message-queue-service";
import { replaceVariables } from "@/app/(features)/messaging/lib/variable-replacer";
import { AppointmentService } from "@/app/(features)/operations/lib/appointment-service";

// POST - Webhook called when appointment is scheduled
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { appointment_id } = body;

        if (!appointment_id) {
            return NextResponse.json(
                { error: 'Missing required field: appointment_id' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Get appointment data with customer, vehicle, and shop details
        const appointment = await AppointmentService.getAppointmentById(appointment_id);

        if (!appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        // Verify appointment is scheduled
        if (appointment.status !== 'scheduled') {
            return NextResponse.json(
                { error: 'Appointment is not scheduled', status: appointment.status },
                { status: 400 }
            );
        }

        // Get customer phone number
        const customer = Array.isArray(appointment.customer) ? appointment.customer[0] : appointment.customer;
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
            .eq('id', appointment.shop_id)
            .single();

        if (shopError || !shop) {
            console.error('Error fetching shop:', shopError);
            return NextResponse.json(
                { error: 'Shop not found' },
                { status: 404 }
            );
        }

        // Get vehicle data
        const vehicle = Array.isArray(appointment.vehicle) ? appointment.vehicle[0] : appointment.vehicle;

        // Format appointment date and time
        const appointmentDate = appointment.appointment_date
            ? new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : '';

        const appointmentTime = appointment.start_time
            ? new Date(`1970-01-01T${appointment.start_time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
            : '';

        // 2. Find matching templates (trigger_type = 'appointment_scheduled')
        const templates = await getTemplatesByTrigger(appointment.shop_id, 'appointment_scheduled');

        if (templates.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No active templates found for appointment_scheduled trigger',
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
                        customer_address: ''
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
                    appointment: {
                        appointment_date: appointmentDate,
                        appointment_time: appointmentTime,
                        start_time: appointment.start_time || '',
                        service_type: appointment.service_type || '',
                        confirmation_code: appointment.confirmation_code || ''
                    },
                    shop: {
                        shop_name: shop.shop_name || '',
                        shop_phone: shop.shop_phone || '',
                        shop_address: shop.shop_address || '',
                        shop_email: shop.shop_email || ''
                    },
                    service: {
                        service_type: appointment.service_type || 'Service',
                        service_date: appointment.appointment_date || '',
                        service_amount: 0 // Appointments don't have amount until completed
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
                    shop_id: appointment.shop_id,
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
            message: `Created ${queueItems.length} queue item(s) for appointment scheduled`,
            queueItemsCreated: queueItems.length,
            queueItems: queueItems.map(item => ({ id: item.id, template_id: item.template_id })),
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('Error processing appointment scheduled trigger:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}

