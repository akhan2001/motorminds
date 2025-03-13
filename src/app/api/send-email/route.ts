import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email template function
const generateEmailHtml = (props: {
  customerName: string;
  shopName: string;
  message: string;
  subject: string;
  contactPhone?: string;
  contactEmail?: string;
}) => {
  const { customerName, shopName, message, subject, contactPhone, contactEmail } = props;
  
  // Colors from the image
  const colors = {
    black: '#0B090A',
    darkBlue: '#161A1D',
    darkRed: '#660708',
    red: '#A4161A',
    brightRed: '#BA181B',
    lightRed: '#E5383B',
    gray: '#B1A7A6',
    lightGray: '#D3D3D3',
    lighterGray: '#F5F3F4',
    white: '#FFFFFF',
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: ${colors.white};">
          <!-- Header -->
          <div style="background-color: ${colors.black}; color: ${colors.white}; padding: 20px; text-align: center; border-top-left-radius: 4px; border-top-right-radius: 4px;">
            <h1 style="margin: 0; font-size: 24px;">${shopName}</h1>
          </div>

          <!-- Subject Bar -->
          <div style="background-color: ${colors.brightRed}; color: ${colors.white}; padding: 10px 20px; font-weight: bold; font-size: 18px;">
            ${subject}
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px; background-color: ${colors.lighterGray}; color: ${colors.darkBlue}; line-height: 1.6;">
            <p style="margin: 0 0 16px 0;">Hello ${customerName},</p>
            
            <div style="margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <p style="margin: 20px 0 0 0;">
              Thank you for choosing ${shopName}. We appreciate your business!
            </p>
          </div>

          <!-- Call to Action -->
          <div style="padding: 20px; background-color: ${colors.lightGray}; text-align: center;">
            <a href="#" style="background-color: ${colors.red}; color: ${colors.white}; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Schedule Your Next Appointment
            </a>
          </div>

          <!-- Footer -->
          <div style="background-color: ${colors.darkBlue}; color: ${colors.white}; padding: 20px; text-align: center; font-size: 14px; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;">
            <p style="margin: 0 0 10px 0;">
              <strong>${shopName}</strong>
            </p>
            ${contactPhone ? `<p style="margin: 5px 0;">Phone: ${contactPhone}</p>` : ''}
            ${contactEmail ? `<p style="margin: 5px 0;">Email: ${contactEmail}</p>` : ''}
            <div style="margin: 15px 0 5px 0; padding: 10px 0 0 0; border-top: 1px solid ${colors.gray}; font-size: 12px;">
              <p style="margin: 0;">
                © ${new Date().getFullYear()} ${shopName}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export async function POST(request: Request) {
    try {
        const { email, subject, body, recipient_name } = await request.json();
        
        // Validate inputs
        if (!email || !subject || !body) {
            return NextResponse.json(
                { message: 'Email, subject, and body are required' },
                { status: 400 }
            );
        }
        
        // Generate HTML email using the template
        const htmlEmail = generateEmailHtml({
            customerName: recipient_name || 'Valued Customer',
            shopName: 'MotorMinds Auto Shop',
            message: body,
            subject: subject,
            contactPhone: '(555) 123-4567',
            contactEmail: '1four0nine@motorminds.ca'
        });
        
        // Send email using Resend
        const { data, error } = await resend.emails.send({
            from: 'Motorminds <1four0nine@motorminds.ca>',
            to: email,
            subject: subject,
            text: body, // Plain text fallback
            html: htmlEmail,
        });
        
        if (error) {
            return Response.json({ error }, { status: 500 });
        }

        console.log('Email sent with ID:', data?.id);
        return Response.json(data);
    } catch (error) {
        return Response.json({ error }, { status: 500 });
    }
}