import { z } from "zod";

const discountItemsSchema = z.object({
    id: z.string(),
    description: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    notes: z.string().optional(),
    active: z.boolean().optional(),
});