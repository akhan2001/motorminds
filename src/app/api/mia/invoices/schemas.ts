import { z } from 'zod'

// Customer information schema
export const CustomerSchema = z.object({
    id: z.string().optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email().optional(),
    phone_number: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postal_code: z.string().optional()
})

// Vehicle information schema
export const VehicleSchema = z.object({
    id: z.string().optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    vin: z.string().optional(),
    license_plate: z.string().optional(),
    color: z.string().optional(),
    engine: z.string().optional(),
    transmission: z.string().optional(),
    mileage: z.number().int().min(0).optional()
})

// Invoice line item schema
export const InvoiceLineItemSchema = z.object({
    id: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().positive("Quantity must be positive"),
    unit_price: z.number().min(0, "Unit price cannot be negative"),
    line_total: z.number().min(0, "Line total cannot be negative"),
    category: z.enum(['parts', 'labor', 'service', 'other']).default('service')
})

// Invoice creation schema
export const CreateInvoiceSchema = z.object({
    customer: CustomerSchema,
    vehicle: VehicleSchema,
    line_items: z.array(InvoiceLineItemSchema).min(1, "At least one line item is required"),
    notes: z.string().optional(),
    internal_notes: z.string().optional(),
    due_date: z.string().optional(), // ISO date string
    discount_amount: z.number().min(0).default(0),
    tax_rate: z.number().min(0).max(1).default(0.13), // Default HST rate
    status: z.enum(['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']).default('draft')
})

// Invoice update schema (partial)
export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().extend({
    id: z.string()
})

// Invoice search/filter schema
export const InvoiceSearchSchema = z.object({
    customer_name: z.string().optional(),
    vehicle_info: z.string().optional(),
    status: z.enum(['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
    date_from: z.string().optional(), // ISO date string
    date_to: z.string().optional(), // ISO date string
    amount_min: z.number().min(0).optional(),
    amount_max: z.number().min(0).optional(),
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().min(0).default(0)
})

// AI prompt processing schema
export const InvoicePromptSchema = z.object({
    message: z.string().min(1, "Message cannot be empty"),
    context: z.object({
        current_customer_id: z.string().optional(),
        current_vehicle_id: z.string().optional(),
        current_invoice_id: z.string().optional(),
        shop_id: z.string()
    })
})

// Export types
export type Customer = z.infer<typeof CustomerSchema>
export type Vehicle = z.infer<typeof VehicleSchema>
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>
export type InvoiceSearch = z.infer<typeof InvoiceSearchSchema>
export type InvoicePrompt = z.infer<typeof InvoicePromptSchema>

// Helper validation functions
export const validateCustomer = (data: unknown) => CustomerSchema.safeParse(data)
export const validateVehicle = (data: unknown) => VehicleSchema.safeParse(data)
export const validateCreateInvoice = (data: unknown) => CreateInvoiceSchema.safeParse(data)
export const validateUpdateInvoice = (data: unknown) => UpdateInvoiceSchema.safeParse(data)
export const validateInvoiceSearch = (data: unknown) => InvoiceSearchSchema.safeParse(data)
export const validateInvoicePrompt = (data: unknown) => InvoicePromptSchema.safeParse(data)
