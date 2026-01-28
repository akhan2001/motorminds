import { describe, test, expect, afterEach, vi } from 'vitest'
import { calculateInvoiceTotals } from './invoice-calculations'
import type { WorkOrderItem } from '../../operations/types/work-order-items'

describe('Invoice Calculations', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('should calculate labor correctly using labor_hours * unit_price', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Engine Diagnostic',
                item_type: 'labor',
                quantity: 1,
                unit_price: 75.00,
                total_price: 150.00,
                labor_hours: 2,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Oil Change Labor',
                item_type: 'labor',
                quantity: 1,
                unit_price: 50.00,
                total_price: 50.00,
                labor_hours: 1,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Labor total = (2 * 75) + (1 * 50) = 150 + 50 = 200
        expect(result.labourTotal).toBe(200.00)
        expect(result.subtotal).toBe(200.00)
        expect(result.labourItems).toHaveLength(2)
    })

    test('should calculate service correctly using quantity * unit_price', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Tire Rotation',
                item_type: 'service',
                quantity: 1,
                unit_price: 29.99,
                total_price: 29.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Wheel Alignment',
                item_type: 'service',
                quantity: 2,
                unit_price: 79.99,
                total_price: 159.98,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Service total = (1 * 29.99) + (2 * 79.99) = 29.99 + 159.98 = 189.97
        expect(result.servicesTotal).toBe(189.97)
        expect(result.subtotal).toBe(189.97)
        expect(result.servicesItems).toHaveLength(2)
    })

    test('should calculate parts correctly using quantity * unit_price', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Oil Filter',
                item_type: 'part',
                quantity: 1,
                unit_price: 12.99,
                total_price: 12.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Brake Pads',
                item_type: 'part',
                quantity: 4,
                unit_price: 35.00,
                total_price: 140.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Parts total = (1 * 12.99) + (4 * 35.00) = 12.99 + 140.00 = 152.99
        expect(result.partsTotal).toBe(152.99)
        expect(result.subtotal).toBe(152.99)
        expect(result.partsItems).toHaveLength(2)
    })

    test('should exclude expenses from subtotal calculation (tracking only)', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Labor',
                item_type: 'labor',
                quantity: 1,
                unit_price: 50.00,
                total_price: 100.00,
                labor_hours: 2,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Shop Supplies Expense',
                item_type: 'expense',
                quantity: 1,
                unit_price: 25.00,
                total_price: 25.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Part',
                item_type: 'part',
                quantity: 1,
                unit_price: 50.00,
                total_price: 50.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Expenses should be excluded from subtotal
        // Subtotal = labor (2 * 50) + part (1 * 50) = 100 + 50 = 150
        // Expenses are tracked but not included in subtotal
        expect(result.expensesTotal).toBe(0) // Always 0 (tracking only)
        expect(result.subtotal).toBe(150.00) // Does not include expense
        expect(result.labourTotal).toBe(100.00)
        expect(result.partsTotal).toBe(50.00)
        expect(result.expensesItems).toHaveLength(1) // Still tracked in expensesItems array
    })

    test('should calculate discounts correctly and subtract from subtotal', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Service Package',
                item_type: 'service',
                quantity: 1,
                unit_price: 100.00,
                total_price: 100.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: '$15 Off Coupon',
                item_type: 'discount',
                quantity: 1,
                unit_price: 15.00,
                total_price: 15.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: '10% Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 10.00,
                total_price: 10.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discounts total = 15 + 10 = 25
        // Subtotal = service (100) - discounts (25) = 75
        expect(result.discountsTotal).toBe(25.00)
        expect(result.servicesTotal).toBe(100.00)
        expect(result.subtotal).toBe(75.00) // 100 - 25 = 75
        expect(result.discountsItems).toHaveLength(2)
    })


    
    test('should handle discount with negative unit_price correctly (uses absolute value)', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 100.00,
                total_price: 100.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Discount (negative price)',
                item_type: 'discount',
                quantity: 1,
                unit_price: -20.00, // Negative price should be converted to positive
                total_price: -20.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discount should use absolute value: Math.abs(-20) = 20
        // Subtotal = 100 - 20 = 80
        expect(result.discountsTotal).toBe(20.00)
        expect(result.subtotal).toBe(80.00)
    })

    test('should handle multiple discounts with all positive unit prices', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 200.00,
                total_price: 200.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'First Discount (positive)',
                item_type: 'discount',
                quantity: 1,
                unit_price: 15.00,
                total_price: 15.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Second Discount (positive)',
                item_type: 'discount',
                quantity: 1,
                unit_price: 25.00,
                total_price: 25.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discounts total = 15 + 25 = 40
        // Subtotal = 200 - 40 = 160
        expect(result.discountsTotal).toBe(40.00)
        expect(result.subtotal).toBe(160.00)
        expect(result.discountsItems).toHaveLength(2)
    })

    test('should handle multiple discounts with all negative unit prices', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 200.00,
                total_price: 200.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'First Discount (negative)',
                item_type: 'discount',
                quantity: 1,
                unit_price: -15.00,
                total_price: -15.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Second Discount (negative)',
                item_type: 'discount',
                quantity: 1,
                unit_price: -25.00,
                total_price: -25.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discounts should use absolute values: Math.abs(-15) + Math.abs(-25) = 15 + 25 = 40
        // Subtotal = 200 - 40 = 160
        expect(result.discountsTotal).toBe(40.00)
        expect(result.subtotal).toBe(160.00)
        expect(result.discountsItems).toHaveLength(2)
    })

    test('should handle multiple discounts with mixed positive and negative unit prices', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 300.00,
                total_price: 300.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Positive Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 20.00,
                total_price: 20.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Negative Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: -30.00,
                total_price: -30.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '4',
                description: 'Another Positive Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 10.00,
                total_price: 10.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discounts total = Math.abs(20) + Math.abs(-30) + Math.abs(10) = 20 + 30 + 10 = 60
        // Subtotal = 300 - 60 = 240
        expect(result.discountsTotal).toBe(60.00)
        expect(result.subtotal).toBe(240.00)
        expect(result.discountsItems).toHaveLength(3)
    })

    test('should handle discounts with different quantities correctly', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 500.00,
                total_price: 500.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Discount with quantity 2 (positive)',
                item_type: 'discount',
                quantity: 2,
                unit_price: 15.00,
                total_price: 30.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Discount with quantity 3 (negative)',
                item_type: 'discount',
                quantity: 3,
                unit_price: -10.00,
                total_price: -30.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discounts total = (2 * Math.abs(15)) + (3 * Math.abs(-10)) = 30 + 30 = 60
        // Subtotal = 500 - 60 = 440
        expect(result.discountsTotal).toBe(60.00)
        expect(result.subtotal).toBe(440.00)
        expect(result.discountsItems).toHaveLength(2)
    })

    test('should handle zero discount value correctly', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 100.00,
                total_price: 100.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Zero Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 0,
                total_price: 0,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Negative Zero Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: -0,
                total_price: -0,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discounts total = Math.abs(0) + Math.abs(-0) = 0 + 0 = 0
        // Subtotal = 100 - 0 = 100
        expect(result.discountsTotal).toBe(0)
        expect(result.subtotal).toBe(100.00)
        expect(result.discountsItems).toHaveLength(2)
    })

    test('should handle very large discount values correctly', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Expensive Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 10000.00,
                total_price: 10000.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Large Positive Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 2500.00,
                total_price: 2500.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Large Negative Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: -1500.00,
                total_price: -1500.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discounts total = Math.abs(2500) + Math.abs(-1500) = 2500 + 1500 = 4000
        // Subtotal = 10000 - 4000 = 6000
        expect(result.discountsTotal).toBe(4000.00)
        expect(result.subtotal).toBe(6000.00)
        expect(result.discountsItems).toHaveLength(2)
    })

    test('should handle discount that exceeds subtotal (resulting in negative subtotal)', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Small Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 50.00,
                total_price: 50.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Large Discount (positive)',
                item_type: 'discount',
                quantity: 1,
                unit_price: 100.00,
                total_price: 100.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discounts total = 100
        // Subtotal = 50 - 100 = -50 (negative subtotal is allowed)
        expect(result.discountsTotal).toBe(100.00)
        expect(result.subtotal).toBe(-50.00)
    })

    test('should handle discount that exceeds subtotal with negative unit price', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Small Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 50.00,
                total_price: 50.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Large Discount (negative)',
                item_type: 'discount',
                quantity: 1,
                unit_price: -100.00,
                total_price: -100.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discounts total = Math.abs(-100) = 100
        // Subtotal = 50 - 100 = -50 (negative subtotal is allowed)
        expect(result.discountsTotal).toBe(100.00)
        expect(result.subtotal).toBe(-50.00)
    })

    test('should calculate fees correctly using quantity * unit_price', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Environmental Fee',
                item_type: 'fee',
                quantity: 1,
                unit_price: 5.00,
                total_price: 5.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Disposal Fee',
                item_type: 'fee',
                quantity: 2,
                unit_price: 3.50,
                total_price: 7.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Fees total = (1 * 5.00) + (2 * 3.50) = 5.00 + 7.00 = 12.00
        expect(result.feesTotal).toBe(12.00)
        expect(result.subtotal).toBe(12.00)
        expect(result.feesItems).toHaveLength(2)
    })

    test('should calculate packages correctly using quantity * unit_price', () => {
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
                description: 'Tire Package',
                item_type: 'package',
                quantity: 2,
                unit_price: 199.99,
                total_price: 399.98,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Packages total = (1 * 59.99) + (2 * 199.99) = 59.99 + 399.98 = 459.97
        expect(result.packagesTotal).toBe(459.97)
        expect(result.subtotal).toBe(459.97)
        expect(result.packagesItems).toHaveLength(2)
    })

    test('should calculate comprehensive invoice with all item types correctly', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Engine Repair Labor',
                item_type: 'labor',
                quantity: 1,
                unit_price: 75.00,
                total_price: 225.00,
                labor_hours: 3,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Oil Change Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 29.99,
                total_price: 29.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Oil Filter Part',
                item_type: 'part',
                quantity: 1,
                unit_price: 12.99,
                total_price: 12.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '4',
                description: 'Shop Supplies Expense',
                item_type: 'expense',
                quantity: 1,
                unit_price: 15.00,
                total_price: 15.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '5',
                description: 'Environmental Fee',
                item_type: 'fee',
                quantity: 1,
                unit_price: 5.00,
                total_price: 5.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '6',
                description: 'Maintenance Package',
                item_type: 'package',
                quantity: 1,
                unit_price: 99.99,
                total_price: 99.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '7',
                description: '$20 Customer Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 20.00,
                total_price: 20.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Labor: 3 hours * 75 = 225
        // Service: 1 * 29.99 = 29.99
        // Parts: 1 * 12.99 = 12.99
        // Expenses: 0 (excluded from subtotal)
        // Fees: 1 * 5.00 = 5.00
        // Packages: 1 * 99.99 = 99.99
        // Discounts: 1 * 20.00 = 20.00
        // Subtotal = 225 + 29.99 + 12.99 + 5.00 + 99.99 - 20.00 = 352.97
        expect(result.labourTotal).toBe(225.00)
        expect(result.servicesTotal).toBe(29.99)
        expect(result.partsTotal).toBe(12.99)
        expect(result.expensesTotal).toBe(0) // Expenses excluded
        expect(result.feesTotal).toBe(5.00)
        expect(result.packagesTotal).toBe(99.99)
        expect(result.discountsTotal).toBe(20.00)
        expect(result.subtotal).toBe(352.97)
        
        // Verify items are properly categorized
        expect(result.labourItems).toHaveLength(1)
        expect(result.servicesItems).toHaveLength(1)
        expect(result.partsItems).toHaveLength(1)
        expect(result.expensesItems).toHaveLength(1) // Tracked but not included in subtotal
        expect(result.feesItems).toHaveLength(1)
        expect(result.packagesItems).toHaveLength(1)
        expect(result.discountsItems).toHaveLength(1)
        expect(result.approvedItems).toHaveLength(7)
    })

    test('should exclude inactive items from calculations', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Approved Part',
                item_type: 'part',
                quantity: 1,
                unit_price: 50.00,
                total_price: 50.00,
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
                unit_price: 30.00,
                total_price: 30.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: false,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Rejected Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 25.00,
                total_price: 25.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: false,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Should only include active items
        expect(result.subtotal).toBe(50.00)
        expect(result.partsTotal).toBe(50.00)
        expect(result.servicesTotal).toBe(0)
        expect(result.approvedItems).toHaveLength(1)
        expect(result.rejectedItems).toHaveLength(2)
    })

    test('should handle zero values correctly', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Zero Quantity Part',
                item_type: 'part',
                quantity: 0,
                unit_price: 50.00,
                total_price: 0,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '2',
                description: 'Zero Price Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 0,
                total_price: 0,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: '3',
                description: 'Zero Hours Labor',
                item_type: 'labor',
                quantity: 1,
                unit_price: 50.00,
                total_price: 0,
                labor_hours: 0,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // All should be zero
        expect(result.partsTotal).toBe(0)
        expect(result.servicesTotal).toBe(0)
        expect(result.labourTotal).toBe(0)
        expect(result.subtotal).toBe(0)
    })

    test('should handle missing labor_hours for labor items (defaults to 0)', () => {
        const items: WorkOrderItem[] = [
            {
                id: '1',
                description: 'Labor without hours',
                item_type: 'labor',
                quantity: 1,
                unit_price: 50.00,
                total_price: 50.00,
                // labor_hours is missing
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Should default to 0 hours, so labor total = 0 * 50 = 0
        expect(result.labourTotal).toBe(0)
        expect(result.subtotal).toBe(0)
    })

    test('should handle empty items array', () => {
        const items: WorkOrderItem[] = []

        const result = calculateInvoiceTotals(items)

        expect(result.subtotal).toBe(0)
        expect(result.labourTotal).toBe(0)
        expect(result.partsTotal).toBe(0)
        expect(result.servicesTotal).toBe(0)
        expect(result.expensesTotal).toBe(0)
        expect(result.feesTotal).toBe(0)
        expect(result.packagesTotal).toBe(0)
        expect(result.discountsTotal).toBe(0)
        expect(result.approvedItems).toHaveLength(0)
        expect(result.rejectedItems).toHaveLength(0)
    })
})

