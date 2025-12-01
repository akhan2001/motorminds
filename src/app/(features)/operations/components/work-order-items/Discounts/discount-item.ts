import { z } from "zod";

// Discounts item Zod schema for validation
export const discountItemSchema = z.object({
    id: z.string(),
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be greater than 0"),
    unit_price: z.number().max(0, "Discount unit price must be negative or zero"),
    total_price: z.number(),
    unit_cost: z.number().optional(),
    total_cost: z.number().optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
    active: z.boolean().optional(),
});

// TypeScript type derived from schema
export type DiscountItem = z.infer<typeof discountItemSchema>;

// Form data type for creating/editing discount items
export const discountItemFormSchema = discountItemSchema.omit({ 
    id: true, 
    total_price: true, 
    total_cost: true 
}).extend({
    id: z.string().optional(),
});

export type DiscountItemFormData = z.infer<typeof discountItemFormSchema>;

// Create data type for new discount items
export const discountItemCreateSchema = discountItemFormSchema.extend({
    work_order_id: z.string(),
    shop_id: z.string(),
    item_type: z.literal('discount'),
});

export type DiscountItemCreateData = z.infer<typeof discountItemCreateSchema>;

// Legacy export for backward compatibility
export const discountItemsSchema = discountItemSchema;