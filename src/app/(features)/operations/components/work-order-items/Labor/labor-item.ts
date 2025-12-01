import { z } from "zod";

// Labor item Zod schema for validation
export const laborItemSchema = z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required"),
    labor_hours: z.number().min(0.01, "Labor hours must be greater than 0"),
    unit_price: z.number().min(0, "Unit price must be non-negative"),
    total_price: z.number(),
    unit_cost: z.number().optional(),
    total_cost: z.number().optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
    technician_id: z.string().optional(),
    active: z.boolean().optional(),
});

// TypeScript type derived from schema
export type LaborItem = z.infer<typeof laborItemSchema>;

// Form data type for creating/editing labor items
export const laborItemFormSchema = laborItemSchema.omit({ 
    id: true, 
    total_price: true, 
    total_cost: true 
}).extend({
    id: z.string().optional(),
});

export type LaborItemFormData = z.infer<typeof laborItemFormSchema>;

// Create data type for new labor items
export const laborItemCreateSchema = laborItemFormSchema.extend({
    work_order_id: z.string(),
    shop_id: z.string(),
    item_type: z.literal('labor'),
});

export type LaborItemCreateData = z.infer<typeof laborItemCreateSchema>;

// Legacy exports for backward compatibility
export const laborItemsSchema = laborItemSchema;