import { z } from "zod";

// Parts item Zod schema for validation
export const partsItemSchema = z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required"),
    part_number: z.string().optional(),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unit_price: z.number().min(0, "Unit price must be non-negative"),
    total_price: z.number(),
    unit_cost: z.number().optional(),
    total_cost: z.number().optional(),
    supplier: z.string().optional(),
    category: z.string().optional(),
    warranty_period: z.string().optional(),
    notes: z.string().optional(),
    active: z.boolean().optional(),
});

// TypeScript type derived from schema
export type PartsItem = z.infer<typeof partsItemSchema>;

// Form data type for creating/editing parts items
export const partsItemFormSchema = partsItemSchema.omit({ 
    id: true, 
    total_price: true, 
    total_cost: true 
}).extend({
    id: z.string().optional(),
});

export type PartsItemFormData = z.infer<typeof partsItemFormSchema>;

// Create data type for new parts items
export const partsItemCreateSchema = partsItemFormSchema.extend({
    work_order_id: z.string(),
    shop_id: z.string(),
    item_type: z.literal('part'),
});

export type PartsItemCreateData = z.infer<typeof partsItemCreateSchema>;
