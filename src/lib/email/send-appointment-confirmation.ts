import { Resend } from 'resend';
import { generateAppointmentConfirmationEmail } from '@/lib/email-templates/appointment-confirmation';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

interface EmailData {
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
        customer_email?: string;
        customer_phone?: string;
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

export async function sendAppointmentConfirmationEmail(data: EmailData) {
    const { appointment, customer, vehicle, shop } = data;
    
    // Check if customer has email
    const customerEmail = customer.customer_email;
    if (!customerEmail) {
        throw new Error('Customer email is required to send appointment confirmation');
    }
    
    // Generate email content
    const { subject, html } = generateAppointmentConfirmationEmail(data);
    
    // Create shop-specific email domain: [shopName]@motorminds.ca
    const shopNameClean = shop.shop_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
        .substring(0, 20); // Limit length for email compatibility
    
    const fromEmail = `${shopNameClean}@motorminds.ca`;
    
    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
        from: `${shop.shop_name} <${fromEmail}>`,
        to: [customerEmail],
        subject: subject,
        html: html
    });
    
    if (error) {
        console.error('Email sending error:', error);
        throw new Error(`Failed to send appointment confirmation email: ${error.message}`);
    }
    
    return emailData;
}
