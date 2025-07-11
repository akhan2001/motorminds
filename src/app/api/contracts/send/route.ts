
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { customer, shop, pdfBase64, contractId } = await req.json();

        if (!customer || !shop || !pdfBase64 || !contractId) {
            return NextResponse.json({ error: 'Missing required data to send email.' }, { status: 400 });
        }

        const fromAddress = `${shop.shop_name} <noreply@motorminds.ca>`;

        // Send email with Resend
        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to: [customer.customer_email],
            subject: `Service Contract from ${shop.shop_name}`,
            html: `
                <p>Hello ${customer.customer_name || 'Customer'},</p>
                <p>Please find attached the service contract for your review.</p>
                <p>Thank you,</p>
                <p><strong>${shop.shop_name}</strong></p>
            `,
            attachments: [
                {
                    filename: `contract-${contractId}.pdf`,
                    content: Buffer.from(pdfBase64, 'base64'),
                },
            ],
        });

        if (error) {
            console.error('Resend API error:', error);
            return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Email sent successfully!', data });

    } catch (error) {
        console.error('Error in send contract API:', error);
        return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
    }
} 