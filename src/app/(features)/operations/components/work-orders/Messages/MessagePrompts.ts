// Prompts for generating messages for work orders

export interface MessageTemplate {
    id: string
    name: string
    template: string
    description: string
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
    {
        id: 'ready_for_pickup',
        name: 'Ready for Pickup',
        template: "Hey [Customer Name], your vehicle is now ready for pickup! Please contact us if you have any questions or concerns. See you soon!",
        description: 'Standard message when work is completed and vehicle is ready'
    },
    {
        id: 'ready_for_pickup_formal',
        name: 'Ready for Pickup (Formal)',
        template: "Dear [Customer Name], we're pleased to inform you that your [Vehicle] has been serviced and is ready for pickup. Please contact us if you have any questions or concerns.",
        description: 'More formal version of the pickup ready message'
    },
    {
        id: 'ready_for_pickup_with_details',
        name: 'Ready with Service Details',
        template: "Hi [Customer Name], your [Vehicle] service is complete! We've finished the [Service Description] and your vehicle is ready for pickup. Please give us a call when you're ready to collect it.",
        description: 'Includes basic service details in the message'
    },
    {
        id: 'appointed_confirmation_text',
        name: 'Appointment Confirmation Text',
        template: "Hi [Customer Name], your appointment for [Service Description] on [Date] at [Time] has been confirmed. We'll see you there!",
        description: 'Includes basic service details in the message'
    }
]

export const DEFAULT_COMPLETION_MESSAGE = MESSAGE_TEMPLATES[0].template

// Function to replace placeholders in message templates
export function formatMessage(
    template: string, 
    customerName: string, 
    vehicleInfo?: string, 
    serviceDescription?: string
): string {
    return template
        .replace(/\[Customer Name\]/g, customerName)
        .replace(/\[Vehicle\]/g, vehicleInfo || 'vehicle')
        .replace(/\[Service Description\]/g, serviceDescription || 'requested work')
}