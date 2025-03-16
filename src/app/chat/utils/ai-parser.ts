import { z } from "zod";

const customerFormSchema = z.object({
    customer_name: z.string().min(1, "Customer name is required")
    .describe("The name of the customer"),
    customer_phone: z.string().min(1, "Customer phone is required")
    .describe("The phone number of the customer"),
    customer_email: z.string().min(1, "Customer email is required")
    .describe("The email address of the customer"),
    customer_address: z.string().min(1, "Customer address is required")
    .describe("The address of the customer"),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;

// Email message schema
const emailMessageSchema = z.object({
    recipient_name: z.string().min(1, "Recipient name is required")
        .describe("The name of the email recipient"),
    recipient_email: z.string().email("Valid email is required")
        .describe("The email address of the recipient"),
    subject: z.string().min(1, "Subject is required")
        .describe("The subject line of the email"),
    message: z.string().min(1, "Message body is required")
        .describe("The body content of the email, professionally formatted")
});

export type EmailMessageData = z.infer<typeof emailMessageSchema>;

// Create a server-side API endpoint to handle parsing
export async function parseCustomerInfo(input: string): Promise<CustomerFormData> {
    try {
        const response = await fetch('/api/parse-customer-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input }),
        });
        
        if (!response.ok) {
            throw new Error(`Failed to parse customer info: ${response.statusText}`);
        }
        
        const data = await response.json();
        return customerFormSchema.parse(data);
    } catch (error) {
        console.error("Error parsing customer info:", error);
        throw error;
    }
}

// Parse email message content using API endpoint
export async function parseEmailMessage(input: string): Promise<EmailMessageData> {
    try {
        // console.log("Parsing email message:", input);
        const response = await fetch('/api/parse-email-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input }),
        });
        
        if (!response.ok) {
            throw new Error(`Failed to parse email message: ${response.statusText}`);
        }
        
        const data = await response.json();
        return emailMessageSchema.parse(data);
    } catch (error) {
        console.error("Error parsing email message:", error);
        throw error;
    }
}