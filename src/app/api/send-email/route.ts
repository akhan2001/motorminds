import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email, subject, body } = await request.json();
        
        // Validate inputs
        if (!email || !subject || !body) {
            return NextResponse.json(
                { message: 'Email, subject, and body are required' },
                { status: 400 }
            );
        }
        
        // Send email using Resend
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: subject,
            text: body,
            // You can also use HTML
            html: body.replace(/\n/g, '<br>'),
        });
        
        if (error) {
            console.error('Resend API error:', error);
            return NextResponse.json(
                { message: 'Failed to send email', error: error.message },
                { status: 500 }
            );
        }
        
        console.log('Email sent with ID:', data?.id);
        
        // Return success response
        return NextResponse.json({ success: true, id: data?.id });
    } catch (error) {
        console.error('Error in send-email API:', error);
        return NextResponse.json(
            { message: 'Failed to send email', error: (error as Error).message },
            { status: 500 }
        );
    }
}