import React from 'react';

interface EmailTemplateProps {
  customerName: string;
  shopName: string;
  message: string;
  subject: string;
  contactPhone?: string;
  contactEmail?: string;
  shopLogo?: string;
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
  customerName,
  shopName,
  message,
  subject,
  contactPhone,
  contactEmail,
  shopLogo,
}) => {
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

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0',
        backgroundColor: colors.white,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: colors.black,
          color: colors.white,
          padding: '20px',
          textAlign: 'center',
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '4px',
        }}
      >
        {shopLogo ? (
          <img 
            src={shopLogo} 
            alt={`${shopName} Logo`} 
            style={{ maxHeight: '60px', marginBottom: '10px' }} 
          />
        ) : (
          <h1 style={{ margin: '0', fontSize: '24px' }}>{shopName}</h1>
        )}
      </div>

      {/* Subject Bar */}
      <div
        style={{
          backgroundColor: colors.brightRed,
          color: colors.white,
          padding: '10px 20px',
          fontWeight: 'bold',
          fontSize: '18px',
        }}
      >
        {subject}
      </div>

      {/* Content */}
      <div
        style={{
          padding: '30px 20px',
          backgroundColor: colors.lighterGray,
          color: colors.darkBlue,
          lineHeight: '1.6',
        }}
      >
        <p style={{ margin: '0 0 16px 0' }}>Hello {customerName},</p>
        
        <div 
          style={{ margin: '20px 0' }}
          dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, '<br>') }} 
        />
        
        <p style={{ margin: '20px 0 0 0' }}>
          Thank you for choosing {shopName}. We appreciate your business!
        </p>
      </div>

      {/* Call to Action */}
      <div
        style={{
          padding: '20px',
          backgroundColor: colors.lightGray,
          textAlign: 'center',
        }}
      >
        <a
          href="#"
          style={{
            backgroundColor: colors.red,
            color: colors.white,
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            display: 'inline-block',
          }}
        >
          Schedule Your Next Appointment
        </a>
      </div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: colors.darkBlue,
          color: colors.white,
          padding: '20px',
          textAlign: 'center',
          fontSize: '14px',
          borderBottomLeftRadius: '4px',
          borderBottomRightRadius: '4px',
        }}
      >
        <p style={{ margin: '0 0 10px 0' }}>
          <strong>{shopName}</strong>
        </p>
        {contactPhone && (
          <p style={{ margin: '5px 0' }}>
            Phone: {contactPhone}
          </p>
        )}
        {contactEmail && (
          <p style={{ margin: '5px 0' }}>
            Email: {contactEmail}
          </p>
        )}
        <div
          style={{
            margin: '15px 0 5px 0',
            padding: '10px 0 0 0',
            borderTop: `1px solid ${colors.gray}`,
            fontSize: '12px',
          }}
        >
          <p style={{ margin: '0' }}>
            © {new Date().getFullYear()} {shopName}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

// This function renders the template to HTML string for sending via email
export const renderEmailTemplate = (props: EmailTemplateProps): string => {
  // This is a simple way to render the component to a string
  // In a real app, you might want to use a library like React DOM Server
  
  const template = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${props.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        ${React.createElement(EmailTemplate, props).toString()}
      </body>
    </html>
  `;
  
  return template;
};

// Example usage in API route:
/*
import { renderEmailTemplate } from '@/app/messaging/components/email-template';

// In your API route
const emailHtml = renderEmailTemplate({
  customerName: "John Doe",
  shopName: "MotorMinds Auto Shop",
  subject: "Your Vehicle Service Reminder",
  message: "Your vehicle is due for its regular maintenance. Would you like to schedule an appointment?",
  contactPhone: "(555) 123-4567",
  contactEmail: "service@motorminds.ca",
  shopLogo: "https://yourshop.com/logo.png"
});

// Send email with the HTML template
const { data, error } = await resend.emails.send({
  from: 'Motorminds <1four0nine@motorminds.ca>',
  to: email,
  subject: subject,
  html: emailHtml,
});
*/

export default EmailTemplate;