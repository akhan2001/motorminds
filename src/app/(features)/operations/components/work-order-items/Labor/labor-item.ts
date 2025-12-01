import { z } from "zod";

const laborItemsSchema = z.object({
    id: z.string(),
    description: z.string(),
    labor_hours: z.number(),
    unit_price: z.number(),
    rate_per_hour: z.number(),
    total_price: z.number(),
    notes: z.string().optional(),
    technician_id: z.string().optional(),
    active: z.boolean().optional(),
});