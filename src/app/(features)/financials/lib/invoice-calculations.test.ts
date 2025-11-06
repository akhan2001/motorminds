import { describe, it, expect } from 'vitest'
import { calculateInvoiceTotals } from './invoice-calculations'
import type { WorkOrderItem } from '../../operations/types/work-order-items'

describe('Invoice Calculations', () => {
    it('should calculate subtotal correctly with discount items', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Oil Change Package',
                item_type: 'package',
                quantity: 1,
                unit_price: 59.99,
                total_price: 59.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: '$10 Off Oil Change',
                item_type: 'discount',
                quantity: 1,
                unit_price: 10,
                total_price: 10,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Subtotal should be 59.99 - 10.00 = 49.99 (discount subtracts)
        expect(result.subtotal).toBe(49.99)
        expect(result.discountsTotal).toBe(10.00)
    })

    it('should exclude inactive items from calculations', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Part',
                item_type: 'part',
                quantity: 1,
                unit_price: 50,
                total_price: 50,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Declined Part',
                item_type: 'part',
                quantity: 1,
                unit_price: 30,
                total_price: 30,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: false,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Should only include active item
        expect(result.subtotal).toBe(50.00)
        expect(result.partsTotal).toBe(50.00)
    })

    it('should handle multiple item types with discounts correctly', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Labor',
                item_type: 'labor',
                quantity: 1,
                unit_price: 50, // Changed from 100 to 50 so labor_hours * unit_price = 2 * 50 = 100
                total_price: 100,
                labor_hours: 2,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Part',
                item_type: 'part',
                quantity: 2,
                unit_price: 25,
                total_price: 50,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 10,
                total_price: 10,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Subtotal = (2 hours * 50/hour) + (2 * 25) - 10 = 100 + 50 - 10 = 140
        expect(result.subtotal).toBe(140.00)
        expect(result.labourTotal).toBe(100.00) // 2 hours * 50 per hour
        expect(result.partsTotal).toBe(50.00)
        expect(result.discountsTotal).toBe(10.00)
    })
})

