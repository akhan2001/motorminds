import { z } from 'zod'

export const appointmentSchema = z.object({
    customer_id: z.string().min(1, "Please select a customer"),
    vehicle_id: z.string().min(1, "Please select a vehicle"),
    appointment_date: z.string().min(1, "Please select a date"),
    start_time: z.string().min(1, "Please select a time slot"),
    end_time: z.string().min(1, "End time is required"),
    service_type: z.string().min(1, "Please select a service type"),
    notes: z.string().optional()
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>
