// Email templates for invoice sending

export interface EmailTemplate {
    id: string
    name: string
    template: string
    description: string
}

export const INVOICE_EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: 'invoice_ready',
        name: 'Invoice Ready',
        template: "Hi [Customer Name], your invoice #[Invoice Number] for [Vehicle] is ready. The total amount is [Total Amount]. Please review and let us know if you have any questions. Thank you for your business!",
        description: 'Standard invoice notification email'
    },
    {
        id: 'invoice_ready_formal',
        name: 'Invoice Ready (Formal)',
        template: "Dear [Customer Name], we are pleased to provide you with invoice #[Invoice Number] for service on your [Vehicle]. The total amount due is [Total Amount]. Please contact us if you have any questions regarding this invoice.",
        description: 'More formal version of the invoice email'
    },
    {
        id: 'invoice_payment_reminder',
        name: 'Payment Reminder',
        template: "Hi [Customer Name], this is a friendly reminder about invoice #[Invoice Number] for your [Vehicle]. The amount of [Total Amount] is due. Please let us know if you have any questions. Thank you!",
        description: 'Payment reminder for outstanding invoices'
    }
]

export const DEFAULT_INVOICE_MESSAGE = INVOICE_EMAIL_TEMPLATES[0].template

// Function to replace placeholders in email templates
export function formatInvoiceMessage(
    template: string, 
    customerName: string, 
    vehicleInfo?: string, 
    invoiceNumber?: string,
    totalAmount?: number
): string {
    return template
        .replace(/\[Customer Name\]/g, customerName)
        .replace(/\[Vehicle\]/g, vehicleInfo || 'vehicle')
        .replace(/\[Invoice Number\]/g, invoiceNumber || 'N/A')
        .replace(/\[Total Amount\]/g, totalAmount ? `$${totalAmount.toFixed(2)}` : '$0.00')
}

