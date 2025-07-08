import { z } from 'zod'

export const workOrderSchema = z.object({
    customerId: z.string().uuid("Invalid customer selected."),
    vehicleId: z.string().uuid("Invalid vehicle selected."),
    technicianId: z.string().uuid("Invalid technician selected.").optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
    customer_notes: z.string().optional(),
    // TODO: Add fields for labour and parts later
})

export type WorkOrderFormData = z.infer<typeof workOrderSchema> 