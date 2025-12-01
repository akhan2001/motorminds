import { z } from "zod";

// Services item Zod schema for validation
export const servicesItemSchema = z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unit_price: z.number().min(0, "Unit price must be non-negative"),
    total_price: z.number(),
    unit_cost: z.number().optional(),
    total_cost: z.number().optional(),
    category: z.string().optional(),
    warranty_period: z.string().optional(),
    notes: z.string().optional(),
    technician_id: z.string().optional(),
    active: z.boolean().optional(),
});

// TypeScript type derived from schema
export type ServicesItem = z.infer<typeof servicesItemSchema>;

// Form data type for creating/editing services items
export const servicesItemFormSchema = servicesItemSchema.omit({ 
    id: true, 
    total_price: true, 
    total_cost: true 
}).extend({
    id: z.string().optional(),
});

export type ServicesItemFormData = z.infer<typeof servicesItemFormSchema>;

// Create data type for new services items
export const servicesItemCreateSchema = servicesItemFormSchema.extend({
    work_order_id: z.string(),
    shop_id: z.string(),
    item_type: z.literal('service'),
});

export type ServicesItemCreateData = z.infer<typeof servicesItemCreateSchema>;
