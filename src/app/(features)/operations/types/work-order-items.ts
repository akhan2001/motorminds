// Work order items type definitions - re-exported from Zod schemas for backward compatibility
// All types are now inferred from Zod schemas in validations/work-order-items.ts

export type {
    WorkOrderItem,
    WorkOrderItemType,
    WorkOrderItemFormData,
    WorkOrderItemCreateData,
    WorkOrderItemSummary,
} from '../lib/validations/work-order-items'