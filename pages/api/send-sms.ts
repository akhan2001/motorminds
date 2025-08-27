import type { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';

// Types for the API
interface SendSmsRequest {
  to: string;
  body: string;
}

interface SendSmsResponse {
  success: boolean;
  message?: string;
  data?: {
    sid: string;
    status: string;
    to: string;
    from: string;
    body: string;
    dateCreated: string;
  };
  error?: string;
}

// Environment variables validation
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Validate environment variables at module load
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error('Missing required Twilio environment variables');
}

// Initialize Twilio client
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Utility function to validate phone number format
const isValidPhoneNumber = (phone: string): boolean => {
  // Basic validation for international phone number format
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Utility function to validate request body
const validateRequestBody = (body: any): body is SendSmsRequest => {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof body.to === 'string' &&
    typeof body.body === 'string' &&
    body.to.trim().length > 0 &&
    body.body.trim().length > 0
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SendSmsResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed. Only POST requests are supported.`
    });
  }

  // Validate environment variables
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio configuration error: Missing environment variables');
    return res.status(500).json({
      success: false,
      error: 'SMS service is not properly configured'
    });
  }

  try {
    // Validate request body
    if (!validateRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. Expected: { to: string, body: string }'
      });
    }

    const { to, body } = req.body;

    // Validate phone number format
    if (!isValidPhoneNumber(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Must be in international format (e.g., +1234567890)'
      });
    }

    // Validate message body length (Twilio has a 1600 character limit)
    if (body.length > 1600) {
      return res.status(400).json({
        success: false,
        error: 'Message body too long. Maximum 1600 characters allowed.'
      });
    }

    // Send SMS using Twilio
    const message = await twilioClient.messages.create({
      to: to.trim(),
      from: TWILIO_PHONE_NUMBER,
      body: body.trim()
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      data: {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated?.toISOString() || new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Twilio SMS Error:', error);

    // Handle specific Twilio errors
    if (error.code) {
      let errorMessage = 'Failed to send SMS';
      let statusCode = 400;

      switch (error.code) {
        case 21211:
          errorMessage = 'Invalid phone number';
          break;
        case 21408:
          errorMessage = 'Permission denied for this phone number';
          break;
        case 21610:
          errorMessage = 'Message cannot be sent to this number';
          break;
        case 21614:
          errorMessage = 'Invalid phone number format';
          break;
        case 20003:
          errorMessage = 'Authentication error';
          statusCode = 401;
          break;
        case 20404:
          errorMessage = 'Twilio phone number not found';
          statusCode = 500;
          break;
        default:
          errorMessage = error.message || 'Failed to send SMS';
          if (error.status >= 500) {
            statusCode = 500;
          }
      }

      return res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }

    // Handle general errors
    return res.status(500).json({
      success: false,
      error: 'Internal server error occurred while sending SMS'
    });
  }
}
