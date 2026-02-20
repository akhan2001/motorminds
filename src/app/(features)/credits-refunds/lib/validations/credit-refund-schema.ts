import { z } from 'zod'

/**
 * Credit/Refund status values
 */
export const CREDIT_REFUND_STATUSES = ['pending', 'processed', 'reconciled'] as const
export type CreditRefundStatusValue = typeof CREDIT_REFUND_STATUSES[number]

/**
 * Valid status transitions
 */
export const CREDIT_REFUND_STATUS_TRANSITIONS: Record<CreditRefundStatusValue, CreditRefundStatusValue[]> = {
    pending: ['processed'],
    processed: ['reconciled'],
    reconciled: [],
}

export function isValidStatusTransition(
    from: CreditRefundStatusValue,
    to: CreditRefundStatusValue
): boolean {
    return CREDIT_REFUND_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export function getValidNextStatuses(currentStatus: CreditRefundStatusValue): CreditRefundStatusValue[] {
    return CREDIT_REFUND_STATUS_TRANSITIONS[currentStatus] ?? []
}

/**
 * Schema for creating a credit/refund
 */
export const CreateCreditRefundSchema = z.object({
    shop_id: z.string().uuid('Shop ID must be a valid UUID'),
    amount: z.number().positive('Amount must be greater than 0'),
    supplier: z.string().max(200).nullable().optional(),
    supplier_id: z.string().uuid().nullable().optional(),
    reason: z.string().trim().min(1, 'Reason is required').max(500),
    part_number: z.string().max(100).nullable().optional(),
    description: z.string().max(500).nullable().optional(),
    parts_description: z.string().max(1000).nullable().optional(),
    invoice_number: z.string().max(100).nullable().optional(),
    status: z.enum(CREDIT_REFUND_STATUSES).default('pending'),
    refund_date: z.string().min(1, 'Refund date is required'),
    notes: z.string().max(1000).nullable().optional(),
})

/**
 * Schema for updating a credit/refund
 */
export const UpdateCreditRefundSchema = CreateCreditRefundSchema.partial().extend({
    archived: z.boolean().nullable().optional(),
    archived_at: z.string().nullable().optional(),
})

export type CreateCreditRefundInput = z.infer<typeof CreateCreditRefundSchema>
export type UpdateCreditRefundInput = z.infer<typeof UpdateCreditRefundSchema>
