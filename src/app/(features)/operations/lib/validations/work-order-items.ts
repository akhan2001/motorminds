// Zod validation schemas for work order items
import { z } from 'zod'

// Item type enum
export const WorkOrderItemTypeSchema = z.enum([
    'labor',
    'part',
    'service',
    'fee',
    'discount',
    'package',
    'expense'
])

// Technician schema for joined data
const TechnicianSchema = z.object({
    id: z.string().uuid(),
    first_name: z.string(),
    last_name: z.string().optional().nullable(),
}).optional().nullable()

// Full work order item schema (matches database)
export const WorkOrderItemSchema = z.object({
    id: z.string().uuid(),
    work_order_id: z.string().uuid(),
    shop_id: z.string().uuid(),
    shop_service_id: z.string().uuid().optional().nullable(),
    invoice_id: z.string().optional().nullable(),
    
    item_type: WorkOrderItemTypeSchema,
    description: z.string().min(1).max(500),
    part_number: z.string().max(100).optional().nullable(),
    
    quantity: z.number().positive(),
    unit_price: z.number().nonnegative(),
    total_price: z.number().nonnegative(), // Calculated by DB trigger
    unit_cost: z.number().nonnegative().optional().nullable(),
    total_cost: z.number().nonnegative().optional().nullable(), // Calculated by DB trigger
    
    supplier: z.string().max(200).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    warranty_period: z.string().max(50).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    
    labor_hours: z.number().positive().optional().nullable(),
    technician_id: z.preprocess(
        (val) => val === '' || val === null || val === undefined ? undefined : val,
        z.string().uuid().optional().nullable()
    ),
    active: z.boolean().optional().nullable(),
    is_billable: z.boolean().optional().nullable(), // Whether item appears on customer invoices (expenses default false)
    
    created_at: z.string(),
    completed_at: z.string().optional().nullable(),
    
    // Joined technician data (optional, from Supabase join)
    technician: TechnicianSchema,
}).passthrough() // Allow extra fields from database joins

// Schema for creating items (omits calculated/auto fields)
export const WorkOrderItemCreateSchema = z.object({
    work_order_id: z.string().uuid(),
    item_type: WorkOrderItemTypeSchema,
    description: z.string().min(1).max(500),
    part_number: z.string().max(100).optional().nullable(),
    
    quantity: z.number().positive().default(1),
    unit_price: z.number().nonnegative().default(0),
    unit_cost: z.number().nonnegative().optional().nullable(),
    
    supplier: z.string().max(200).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    warranty_period: z.string().max(50).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    
    labor_hours: z.number().positive().optional().nullable(),
    technician_id: z.preprocess(
        (val) => val === '' || val === null || val === undefined ? undefined : val,
        z.string().uuid().optional().nullable()
    ),
    is_billable: z.boolean().optional(), // Whether item appears on customer invoices (expenses default false)
}).refine(
    (data) => {
        // For labor items, labor_hours should be provided
        if (data.item_type === 'labor' && !data.labor_hours) {
            return false
        }
        return true
    },
    {
        message: 'Labor hours are required for labor items',
        path: ['labor_hours'],
    }
)

// Schema for updating items (all fields optional except validation)
export const WorkOrderItemUpdateSchema = z.object({
    item_type: WorkOrderItemTypeSchema.optional(),
    description: z.string().min(1).max(500).optional(),
    part_number: z.string().max(100).optional().nullable(),
    
    quantity: z.number().positive().optional(),
    unit_price: z.number().nonnegative().optional(),
    unit_cost: z.number().nonnegative().optional().nullable(),
    
    supplier: z.string().max(200).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    warranty_period: z.string().max(50).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    
    labor_hours: z.number().positive().optional().nullable(),
    technician_id: z.preprocess(
        (val) => val === '' || val === null || val === undefined ? undefined : val,
        z.string().uuid().optional().nullable()
    ),
    active: z.boolean().optional().nullable(),
    is_billable: z.boolean().optional().nullable(), // Whether item appears on customer invoices
}).refine(
    (data) => {
        // If description is provided, it must not be empty
        if (data.description !== undefined && data.description.trim().length === 0) {
            return false
        }
        return true
    },
    {
        message: 'Description cannot be empty',
        path: ['description'],
    }
)

// Schema for form data (used in components)
export const WorkOrderItemFormDataSchema = z.object({
    item_type: WorkOrderItemTypeSchema,
    description: z.string().min(1).max(500),
    part_number: z.string().max(100).optional(),
    
    quantity: z.number().positive().default(1),
    unit_price: z.number().nonnegative().default(0),
    unit_cost: z.number().nonnegative().optional(),
    
    supplier: z.string().max(200).optional(),
    category: z.string().max(100).optional(),
    warranty_period: z.string().max(50).optional(),
    notes: z.string().max(1000).optional(),
    
    labor_hours: z.number().positive().optional(),
    technician_id: z.string().uuid().optional(),
    active: z.boolean().optional(),
    is_billable: z.boolean().optional(), // Whether item appears on customer invoices
})

// Summary schema
export const WorkOrderItemSummarySchema = z.object({
    totalLabor: z.number().nonnegative(),
    totalParts: z.number().nonnegative(),
    totalServices: z.number().nonnegative(),
    totalFees: z.number().nonnegative(),
    totalDiscounts: z.number().nonnegative(),
    totalPackages: z.number().nonnegative(),
    grandTotal: z.number(),
    itemCount: z.number().int().nonnegative(),
})

// Type exports (inferred from schemas)
export type WorkOrderItem = z.infer<typeof WorkOrderItemSchema>
export type WorkOrderItemCreateData = z.infer<typeof WorkOrderItemCreateSchema>
export type WorkOrderItemUpdateData = z.infer<typeof WorkOrderItemUpdateSchema>
export type WorkOrderItemFormData = z.infer<typeof WorkOrderItemFormDataSchema>
export type WorkOrderItemSummary = z.infer<typeof WorkOrderItemSummarySchema>
export type WorkOrderItemType = z.infer<typeof WorkOrderItemTypeSchema>

