// Message templates for appointment communications

export interface AppointmentMessageTemplate {
    id: string
    name: string
    template: string
    description: string
    type: 'reminder' | 'confirmation' | 'cancellation' | 'rescheduling' | 'custom'
}

export const APPOINTMENT_MESSAGE_TEMPLATES: AppointmentMessageTemplate[] = [
    {
        id: 'appointment_confirmation',
        name: 'Appointment Confirmation',
        template: "Hi [Customer Name], your appointment for [Service Type] on [Date] at [Time] has been confirmed. We'll see you there!",
        description: 'Standard appointment confirmation message',
        type: 'confirmation'
    },
    {
        id: 'appointment_confirmation_detailed',
        name: 'Detailed Confirmation',
        template: "Hi [Customer Name], your appointment for [Service Type] on [Date] at [Time] has been confirmed. We look forward to servicing your [Vehicle]. If you have any questions, please don't hesitate to call us.",
        description: 'Detailed confirmation message with vehicle info',
        type: 'confirmation'
    },
    {
        id: 'appointment_reminder',
        name: 'Appointment Reminder',
        template: "Hi [Customer Name], this is a friendly reminder about your upcoming appointment for [Service Type] on [Date] at [Time]. If you need to reschedule, please give us a call. See you soon!",
        description: 'Reminder message sent before the appointment',
        type: 'reminder'
    },
    {
        id: 'appointment_check_in',
        name: 'Check-in Reminder',
        template: "Hi [Customer Name], we're ready for your [Service Type] appointment today. Please let us know when you arrive or if you're running late. Thank you!",
        description: 'Check-in reminder for same-day appointments',
        type: 'reminder'
    },
    {
        id: 'custom_message',
        name: 'Custom Message',
        template: "Hi [Customer Name], regarding your appointment on [Date] for [Service Type]:",
        description: 'Template for custom messages',
        type: 'custom'
    }
]

export const DEFAULT_CONFIRMATION_MESSAGE = APPOINTMENT_MESSAGE_TEMPLATES[0].template
export const DEFAULT_REMINDER_MESSAGE = APPOINTMENT_MESSAGE_TEMPLATES[2].template
export const DEFAULT_CUSTOM_MESSAGE = APPOINTMENT_MESSAGE_TEMPLATES[4].template

// Function to replace placeholders in appointment message templates
export function formatAppointmentMessage(
    template: string, 
    customerName: string, 
    appointmentDate?: string,
    appointmentTime?: string,
    serviceType?: string,
    vehicleInfo?: string
): string {
    return template
        .replace(/\[Customer Name\]/g, customerName)
        .replace(/\[Date\]/g, appointmentDate || 'your scheduled date')
        .replace(/\[Time\]/g, appointmentTime || 'your scheduled time')
        .replace(/\[Service Type\]/g, serviceType || 'service')
        .replace(/\[Vehicle\]/g, vehicleInfo || 'vehicle')
}

// Get default message based on type
export function getDefaultMessageByType(type: 'reminder' | 'confirmation' | 'custom'): string {
    switch (type) {
        case 'confirmation':
            return DEFAULT_CONFIRMATION_MESSAGE
        case 'reminder':
            return DEFAULT_REMINDER_MESSAGE
        case 'custom':
        default:
            return DEFAULT_CUSTOM_MESSAGE
    }
}
