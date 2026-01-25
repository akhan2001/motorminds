import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getShopInfo } from '@/utils/supabase/supabase-shop';

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
            <p style="margin: 5px 0 0 0; font-size: 12px; color: ${colors.gray};">DO NOT REPLY</p>
          </div>

          <!-- Subject Bar -->
          <div style="background-color: ${colors.brightRed}; color: ${colors.white}; padding: 10px 20px; font-weight: bold; font-size: 18px;">
            ${subject}
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px; background-color: ${colors.lighterGray}; color: ${colors.darkBlue}; line-height: 1.6;">
            
            <div style="margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
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
		const { email, subject, body, recipient_name, attachments, shopName, shopId } = await request.json();

		// Validate inputs
		if (!email || !subject || !body) {
			return NextResponse.json(
				{ message: 'Email, subject, and body are required' },
				{ status: 400 }
			);
		}

		// Get shop information if shopId is provided
		let shopContactPhone = '';
		let shopContactEmail = '';
		let businessName = shopName || 'MotorMinds Auto Shop';

		if (shopId) {
			try {
				const shopInfo = await getShopInfo(shopId);
				if (shopInfo) {
					businessName = shopInfo.shop_name || businessName;
					shopContactPhone = shopInfo.shop_phone || '';
					shopContactEmail = shopInfo.shop_email || '';
				}
			} catch (error) {
				console.error('Error fetching shop info:', error);
			}
		}

		// Sanitize shop name to create a valid email local-part and construct the from address
		const fromEmailPrefix = businessName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
		const fromAddress = `${businessName} <${fromEmailPrefix}@motorminds.ca>`;

		// Generate HTML email using the template
		const htmlEmail = generateEmailHtml({
			customerName: recipient_name || 'Valued Customer',
			shopName: businessName,
			message: body,
			subject: subject,
			contactPhone: shopContactPhone,
			contactEmail: shopContactEmail
		});

		// Define the email data with proper typing
		const emailData: {
			from: string;
			to: string;
			subject: string;
			text: string;
			html: string;
			attachments?: Array<{ filename: string, content: string }>;
		} = {
			from: fromAddress,
			to: email,
			subject: subject,
			text: body, // Plain text fallback
			html: htmlEmail,
		};

		// Add attachments if present
		if (attachments && attachments.length > 0) {
			emailData.attachments = attachments.map((attachment: any) => ({
				filename: attachment.filename,
				content: attachment.content
			}));
		}

		// Send email using Resend
		const { data, error } = await resend.emails.send(emailData);

		if (error) {
			console.error('Error sending email:', error);
			return Response.json({ error }, { status: 500 });
		}

		console.log('Email sent with ID:', data?.id);
		return Response.json(data);
	} catch (error) {
		console.error('Exception in email sending:', error);
		return Response.json({ error }, { status: 500 });
	}
}