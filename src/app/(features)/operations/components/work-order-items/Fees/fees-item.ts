import { z } from "zod";

// Fees item Zod schema for validation
export const feesItemSchema = z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unit_price: z.number().min(0, "Unit price must be non-negative"),
    total_price: z.number(),
    unit_cost: z.number().optional(),
    total_cost: z.number().optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
    active: z.boolean().optional(),
});

// TypeScript type derived from schema
export type FeesItem = z.infer<typeof feesItemSchema>;

// Form data type for creating/editing fees items
export const feesItemFormSchema = feesItemSchema.omit({ 
    id: true, 
    total_price: true, 
    total_cost: true 
}).extend({
    id: z.string().optional(),
});

export type FeesItemFormData = z.infer<typeof feesItemFormSchema>;

// Create data type for new fees items
export const feesItemCreateSchema = feesItemFormSchema.extend({
    work_order_id: z.string(),
    shop_id: z.string(),
    item_type: z.literal('fee'),
});

export type FeesItemCreateData = z.infer<typeof feesItemCreateSchema>;
