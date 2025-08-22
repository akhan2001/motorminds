interface AppointmentEmailData {
    appointment: {
        id: string;
        appointment_date: string;
        start_time: string;
        end_time: string;
        service_type: string;
        confirmation_code: string;
        notes?: string;
        status: string;
    };
    customer: {
        customer_name?: string;
        first_name?: string;
        last_name?: string;
        customer_email?: string;
        email?: string;
        customer_phone?: string;
        phone_number?: string;
    };
    vehicle: {
        year: number;
        make: string;
        model: string;
        license_plate?: string;
    };
    shop: {
        shop_name: string;
        shop_address?: string;
        shop_phone?: string;
        shop_email?: string;
    };
}

export function generateAppointmentConfirmationEmail(data: AppointmentEmailData): {
    subject: string;
    html: string;
} {
    const { appointment, customer, vehicle, shop } = data;
    
    // Format customer name
    const customerName = customer.customer_name || 
        `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 
        'Valued Customer';
    
    // Format customer email
    const customerEmail = customer.customer_email || customer.email || '';
    
    // Format customer phone
    const customerPhone = customer.customer_phone || customer.phone_number || '';
    
    // Format vehicle info
    const vehicleInfo = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    
    // Format date and time (fix timezone issue)
    // Parse date as local date to avoid timezone conversion issues
    const [year, month, day] = appointment.appointment_date.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };
    
    const startTime = formatTime(appointment.start_time);
    const endTime = formatTime(appointment.end_time);
    
    const subject = `Appointment Confirmed - ${shop.shop_name}`;
    
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">✅ Appointment Confirmed!</h1>
                    <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Your service appointment has been successfully booked</p>
                </div>
                
                <!-- Customer Greeting -->
                <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Hello ${customerName},</p>
                
                <p style="color: #666; font-size: 16px; margin-bottom: 25px;">
                    Thank you for choosing ${shop.shop_name}! We've confirmed your appointment and look forward to serving you.
                </p>
                
                <!-- Appointment Details Card -->
                <div style="background-color: #f0f9ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 25px; margin: 25px 0;">
                    <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 20px;">📅 Appointment Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666; font-weight: 600; width: 140px;">Confirmation Code:</td>
                            <td style="padding: 8px 0; color: #1e40af; font-weight: bold; font-size: 18px;">${appointment.confirmation_code}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666; font-weight: 600;">Date:</td>
                            <td style="padding: 8px 0; color: #333; font-weight: 600;">${appointmentDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666; font-weight: 600;">Time:</td>
                            <td style="padding: 8px 0; color: #333; font-weight: 600;">${startTime} - ${endTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666; font-weight: 600;">Service:</td>
                            <td style="padding: 8px 0; color: #333; font-weight: 600;">${appointment.service_type}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666; font-weight: 600;">Vehicle:</td>
                            <td style="padding: 8px 0; color: #333; font-weight: 600;">${vehicleInfo}${vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}</td>
                        </tr>
                    </table>
                </div>
                
                ${appointment.notes ? `
                    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <h4 style="color: #c2410c; margin: 0 0 10px 0;">📝 Additional Notes:</h4>
                        <p style="margin: 0; color: #9a3412;">${appointment.notes}</p>
                    </div>
                ` : ''}
                
                <!-- Customer Information -->
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #374151; margin: 0 0 15px 0;">👤 Customer Information</h4>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0; color: #666; font-weight: 600; width: 100px;">Name:</td>
                            <td style="padding: 5px 0; color: #333;">${customerName}</td>
                        </tr>
                        ${customerEmail ? `
                            <tr>
                                <td style="padding: 5px 0; color: #666; font-weight: 600;">Email:</td>
                                <td style="padding: 5px 0; color: #333;">${customerEmail}</td>
                            </tr>
                        ` : ''}
                        ${customerPhone ? `
                            <tr>
                                <td style="padding: 5px 0; color: #666; font-weight: 600;">Phone:</td>
                                <td style="padding: 5px 0; color: #333;">${customerPhone}</td>
                            </tr>
                        ` : ''}
                    </table>
                </div>
                
                <!-- Important Information -->
                <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 25px 0;">
                    <h4 style="color: #92400e; margin: 0 0 15px 0;">⚠️ Important Information</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                        <li style="margin-bottom: 8px;">Please arrive 10-15 minutes before your scheduled time</li>
                        <li style="margin-bottom: 8px;">Bring your driver's license and vehicle registration</li>
                        <li style="margin-bottom: 8px;">If you need to reschedule, please call us at least 24 hours in advance</li>
                        <li style="margin-bottom: 0;">Have your confirmation code ready: <strong>${appointment.confirmation_code}</strong></li>
                    </ul>
                </div>
                
                <!-- Shop Information -->
                <div style="border-top: 2px solid #e5e7eb; padding-top: 25px; margin-top: 30px; text-align: center;">
                    <h4 style="color: #374151; margin: 0 0 15px 0;">🏪 ${shop.shop_name}</h4>
                    ${shop.shop_address ? `<p style="color: #666; margin: 5px 0;">${shop.shop_address}</p>` : ''}
                    ${shop.shop_phone ? `<p style="color: #666; margin: 5px 0; font-weight: 600;">📞 ${shop.shop_phone}</p>` : ''}
                    ${shop.shop_email ? `<p style="color: #666; margin: 5px 0;">✉️ ${shop.shop_email}</p>` : ''}
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #999; font-size: 14px; margin: 0;">
                        Thank you for choosing ${shop.shop_name}! We look forward to providing you with excellent service.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    return { subject, html };
}

// Export type for use in other files
export type { AppointmentEmailData };
