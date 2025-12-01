import { z } from "zod";

// Packages item Zod schema for validation
export const packagesItemSchema = z.object({
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
    labor_hours: z.number().optional(), // Packages may include labor
    active: z.boolean().optional(),
});

// TypeScript type derived from schema
export type PackagesItem = z.infer<typeof packagesItemSchema>;

// Form data type for creating/editing packages items
export const packagesItemFormSchema = packagesItemSchema.omit({ 
    id: true, 
    total_price: true, 
    total_cost: true 
}).extend({
    id: z.string().optional(),
});

export type PackagesItemFormData = z.infer<typeof packagesItemFormSchema>;

// Create data type for new packages items
export const packagesItemCreateSchema = packagesItemFormSchema.extend({
    work_order_id: z.string(),
    shop_id: z.string(),
    item_type: z.literal('package'),
});

export type PackagesItemCreateData = z.infer<typeof packagesItemCreateSchema>;
