interface SendAppointmentSMSParams {
    appointment: any;
    customer: any;
    vehicle: any;
    shop: any;
    supabase: any;
}

export async function sendAppointmentSMSConfirmation({
    appointment,
    customer,
    vehicle,
    shop,
    supabase
}: SendAppointmentSMSParams) {
    // Check if customer has a valid phone number
    if (!customer.customer_phone) {
        console.log('No phone number for customer, skipping SMS');
        return;
    }

    // Format appointment date and time
    const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const appointmentTime = new Date(`1970-01-01T${appointment.start_time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Create SMS message template
    const smsMessage = `✅ Appointment Confirmed!

${shop.shop_name || 'Your appointment'} is confirmed:

📅 Date: ${appointmentDate}
⏰ Time: ${appointmentTime}
🚗 Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
🔧 Service: ${appointment.service_type}
🎫 Confirmation: ${appointment.confirmation_code}

📍 ${shop.shop_address || 'Contact us for location'}
📞 ${shop.shop_phone || 'Contact us for phone'}

Reply STOP to opt out.`;

    // Ensure phone number has +1 format
    const formattedPhone = customer.customer_phone.startsWith('+') 
        ? customer.customer_phone 
        : `+1${customer.customer_phone}`;

    try {
        console.log('Sending SMS confirmation via existing API:', {
            to: formattedPhone,
            customerName: customer.customer_name,
            appointmentId: appointment.id
        });

        // Use the existing /api/twilio/messages logic directly
        const { createOrFindCustomerByPhone } = await import('@/utils/phone-number');
        const twilio = (await import('twilio')).default;

        // Check if Twilio credentials are available
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            console.log('Twilio credentials not configured, skipping SMS');
            return;
        }

        // Get shop's phone number
        const shopId = shop.id || shop.shop_id;
        const { data: phoneNumbers, error: phoneError } = await supabase
            .from('twilio_phone_numbers')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', 'active')
            .limit(1);

        if (phoneError || !phoneNumbers || phoneNumbers.length === 0) {
            console.log('No active phone number found for this shop, skipping SMS');
            return;
        }

        const shopPhoneNumber = phoneNumbers[0];

        // Initialize Twilio client
        const twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        // Create or find customer (exactly like /api/twilio/messages)
        const { customerId, isNew, customer: customerRecord } = await createOrFindCustomerByPhone(
            supabase,
            shopId,
            formattedPhone,
            customer.customer_name
        );

        console.log('✅ Customer processed for SMS confirmation:', { 
            customerId, 
            isNew, 
            name: customerRecord.customer_name,
            phone: customerRecord.customer_phone 
        });

        // Send message via Twilio (exactly like /api/twilio/messages)
        const twilioMessage = await twilioClient.messages.create({
            to: formattedPhone,
            from: shopPhoneNumber.phone_number,
            body: smsMessage,
        });

        // Store message in database (exactly like /api/twilio/messages)
        const { data: storedMessage, error: messageError } = await supabase
            .from('sms_messages')
            .insert({
                shop_id: shopId,
                phone_number_id: shopPhoneNumber.id,
                direction: 'outbound',
                from_number: shopPhoneNumber.phone_number,
                to_number: formattedPhone,
                message_body: smsMessage,
                status: 'sent',
                customer_id: customerId,
            });

        if (messageError) {
            console.error('Failed to store message:', messageError);
        }

        // Create or update conversation (exactly like /api/twilio/messages)
        await supabase
            .from('sms_conversations')
            .upsert({
                shop_id: shopId,
                customer_phone: formattedPhone,
                customer_id: customerId,
                last_message_at: new Date().toISOString(),
                customer_name: customerRecord.customer_name
            }, {
                onConflict: 'shop_id,customer_phone'
            });

        console.log('SMS confirmation sent successfully:', {
            to: formattedPhone,
            confirmationCode: appointment.confirmation_code,
            twilioSid: twilioMessage.sid
        });

        return {
            success: true,
            twilioSid: twilioMessage.sid,
            customer: customerRecord
        };

    } catch (error) {
        console.error('Failed to send SMS confirmation:', error);
        throw error;
    }
}
