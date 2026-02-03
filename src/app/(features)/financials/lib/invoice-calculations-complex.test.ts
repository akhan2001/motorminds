// src/app/(features)/financials/lib/invoice-calculations-complex.test.ts

import { describe, test, expect, afterEach, vi } from 'vitest'
import { calculateInvoiceTotals } from './invoice-calculations'
import type { WorkOrderItem } from '../../operations/types/work-order-items'

describe('Complex Invoice Calculations', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('should calculate complex invoice with multiple items of all types, mixed discounts, and inactive items', () => {
        const items: WorkOrderItem[] = [
            // Multiple Labor Items
            {
                id: 'lab-1',
                description: 'Engine Diagnostic Labor',
                item_type: 'labor',
                quantity: 1,
                unit_price: 85.00,
                total_price: 255.00,
                labor_hours: 3,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'lab-2',
                description: 'Transmission Repair Labor',
                item_type: 'labor',
                quantity: 1,
                unit_price: 95.00,
                total_price: 380.00,
                labor_hours: 4,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'lab-3',
                description: 'Brake System Labor',
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
                id: 'lab-4',
                description: 'Declined Labor Work',
                item_type: 'labor',
                quantity: 1,
                unit_price: 100.00,
                total_price: 200.00,
                labor_hours: 2,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: false, // Inactive - should be excluded
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple Service Items
            {
                id: 'svc-1',
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
                id: 'svc-2',
                description: 'Tire Rotation Service',
                item_type: 'service',
                quantity: 2,
                unit_price: 19.99,
                total_price: 39.98,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'svc-3',
                description: 'Wheel Alignment Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 79.99,
                total_price: 79.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'svc-4',
                description: 'AC Recharge Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 89.99,
                total_price: 89.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple Parts Items
            {
                id: 'part-1',
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
                id: 'part-2',
                description: 'Brake Pads (Front)',
                item_type: 'part',
                quantity: 4,
                unit_price: 35.00,
                total_price: 140.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'part-3',
                description: 'Brake Rotors',
                item_type: 'part',
                quantity: 2,
                unit_price: 89.99,
                total_price: 179.98,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'part-4',
                description: 'Transmission Fluid',
                item_type: 'part',
                quantity: 3,
                unit_price: 24.99,
                total_price: 74.97,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'part-5',
                description: 'Air Filter',
                item_type: 'part',
                quantity: 1,
                unit_price: 18.99,
                total_price: 18.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'part-6',
                description: 'Declined Part',
                item_type: 'part',
                quantity: 1,
                unit_price: 50.00,
                total_price: 50.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: false, // Inactive - should be excluded
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple Expense Items (tracking only - excluded from subtotal)
            {
                id: 'exp-1',
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
                id: 'exp-2',
                description: 'Tool Rental Expense',
                item_type: 'expense',
                quantity: 1,
                unit_price: 45.00,
                total_price: 45.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'exp-3',
                description: 'Specialty Equipment Expense',
                item_type: 'expense',
                quantity: 2,
                unit_price: 30.00,
                total_price: 60.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'exp-4',
                description: 'Inactive Expense',
                item_type: 'expense',
                quantity: 1,
                unit_price: 20.00,
                total_price: 20.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: false, // Inactive - should be excluded
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple Discount Items (mixed positive and negative)
            {
                id: 'disc-1',
                description: '$50 Customer Loyalty Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 50.00, // Positive discount
                total_price: 50.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-2',
                description: '$25 Promo Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: -25.00, // Negative discount (should use absolute value)
                total_price: -25.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-3',
                description: '10% Off Discount',
                item_type: 'discount',
                quantity: 2,
                unit_price: 15.00, // Positive discount with quantity
                total_price: 30.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-4',
                description: 'Holiday Special Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: -10.00, // Negative discount
                total_price: -10.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-5',
                description: 'Declined Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 20.00,
                total_price: 20.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: false, // Inactive - should be excluded
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple Fee Items
            {
                id: 'fee-1',
                description: 'Environmental Disposal Fee',
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
                id: 'fee-2',
                description: 'Hazardous Material Fee',
                item_type: 'fee',
                quantity: 2,
                unit_price: 7.50,
                total_price: 15.00,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'fee-3',
                description: 'Shop Supplies Fee',
                item_type: 'fee',
                quantity: 1,
                unit_price: 12.99,
                total_price: 12.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple Package Items
            {
                id: 'pkg-1',
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
                id: 'pkg-2',
                description: 'Brake Service Package',
                item_type: 'package',
                quantity: 1,
                unit_price: 199.99,
                total_price: 199.99,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'pkg-3',
                description: 'Maintenance Package',
                item_type: 'package',
                quantity: 2,
                unit_price: 149.99,
                total_price: 299.98,
                work_order_id: 'wo-1',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Calculate expected totals:
        // Labor: (3 * 85) + (4 * 95) + (2 * 75) = 255 + 380 + 150 = 785
        // Service: (1 * 29.99) + (2 * 19.99) + (1 * 79.99) + (1 * 89.99) = 29.99 + 39.98 + 79.99 + 89.99 = 239.95
        // Parts: (1 * 12.99) + (4 * 35.00) + (2 * 89.99) + (3 * 24.99) + (1 * 18.99) = 12.99 + 140 + 179.98 + 74.97 + 18.99 = 426.93
        // Expenses: 0 (excluded from subtotal, but tracked in expensesItems)
        // Fees: (1 * 5.00) + (2 * 7.50) + (1 * 12.99) = 5 + 15 + 12.99 = 32.99
        // Packages: (1 * 59.99) + (1 * 199.99) + (2 * 149.99) = 59.99 + 199.99 + 299.98 = 559.96
        // Discounts: Math.abs(50) + Math.abs(-25) + (2 * Math.abs(15)) + Math.abs(-10) = 50 + 25 + 30 + 10 = 115
        // Subtotal = 785 + 239.95 + 426.93 + 32.99 + 559.96 - 115 = 1929.83

        expect(result.labourTotal).toBeCloseTo(785.00, 2)
        expect(result.servicesTotal).toBeCloseTo(239.95, 2)
        expect(result.partsTotal).toBeCloseTo(426.93, 2)
        expect(result.expensesTotal).toBe(0) // Expenses excluded from subtotal
        expect(result.feesTotal).toBeCloseTo(32.99, 2)
        expect(result.packagesTotal).toBeCloseTo(559.96, 2)
        expect(result.discountsTotal).toBeCloseTo(115.00, 2) // All discounts use absolute values
        expect(result.subtotal).toBeCloseTo(1929.83, 2)

        // Verify item categorization
        expect(result.labourItems).toHaveLength(3) // Excludes inactive lab-4
        expect(result.servicesItems).toHaveLength(4)
        expect(result.partsItems).toHaveLength(5) // Excludes inactive part-6
        expect(result.expensesItems).toHaveLength(3) // Excludes inactive exp-4, but expenses are tracked
        expect(result.feesItems).toHaveLength(3)
        expect(result.packagesItems).toHaveLength(3)
        expect(result.discountsItems).toHaveLength(4) // Excludes inactive disc-5

        // Verify approved vs rejected items
        // Active items: lab-1, lab-2, lab-3, svc-1, svc-2, svc-3, svc-4, part-1, part-2, part-3, part-4, part-5, exp-1, exp-2, exp-3, disc-1, disc-2, disc-3, disc-4, fee-1, fee-2, fee-3, pkg-1, pkg-2, pkg-3 = 25
        expect(result.approvedItems).toHaveLength(25) // 3 labor + 4 service + 5 parts + 3 expenses + 4 discounts + 3 fees + 3 packages = 25
        expect(result.rejectedItems).toHaveLength(4) // lab-4, part-6, exp-4, disc-5
    })

    test('should handle very large complex invoice with edge cases', () => {
        const items: WorkOrderItem[] = [
            // Multiple labor items with varying hours
            {
                id: 'lab-1',
                description: 'Major Engine Overhaul',
                item_type: 'labor',
                quantity: 1,
                unit_price: 120.00,
                total_price: 1440.00,
                labor_hours: 12,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'lab-2',
                description: 'Transmission Rebuild',
                item_type: 'labor',
                quantity: 1,
                unit_price: 110.00,
                total_price: 880.00,
                labor_hours: 8,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'lab-3',
                description: 'Body Work Labor',
                item_type: 'labor',
                quantity: 1,
                unit_price: 90.00,
                total_price: 450.00,
                labor_hours: 5,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple services
            {
                id: 'svc-1',
                description: 'Full Service Inspection',
                item_type: 'service',
                quantity: 1,
                unit_price: 149.99,
                total_price: 149.99,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'svc-2',
                description: 'Paint Correction Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 299.99,
                total_price: 299.99,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },

            // Many parts with various quantities
            {
                id: 'part-1',
                description: 'Engine Gasket Set',
                item_type: 'part',
                quantity: 1,
                unit_price: 89.99,
                total_price: 89.99,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'part-2',
                description: 'Piston Rings',
                item_type: 'part',
                quantity: 4,
                unit_price: 45.00,
                total_price: 180.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'part-3',
                description: 'Transmission Fluid',
                item_type: 'part',
                quantity: 6,
                unit_price: 24.99,
                total_price: 149.94,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'part-4',
                description: 'Oil Filter',
                item_type: 'part',
                quantity: 2,
                unit_price: 12.99,
                total_price: 25.98,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'part-5',
                description: 'Spark Plugs',
                item_type: 'part',
                quantity: 8,
                unit_price: 8.99,
                total_price: 71.92,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple expenses (tracking only)
            {
                id: 'exp-1',
                description: 'Specialty Tool Rental',
                item_type: 'expense',
                quantity: 1,
                unit_price: 150.00,
                total_price: 150.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'exp-2',
                description: 'Equipment Maintenance',
                item_type: 'expense',
                quantity: 1,
                unit_price: 75.00,
                total_price: 75.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'exp-3',
                description: 'Shop Supplies',
                item_type: 'expense',
                quantity: 3,
                unit_price: 25.00,
                total_price: 75.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple discounts with mixed signs and quantities
            {
                id: 'disc-1',
                description: '$200 Customer Loyalty Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 200.00, // Positive
                total_price: 200.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-2',
                description: '$100 Promo Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: -100.00, // Negative
                total_price: -100.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-3',
                description: 'Bulk Discount',
                item_type: 'discount',
                quantity: 3,
                unit_price: 25.00, // Positive with quantity
                total_price: 75.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-4',
                description: 'Seasonal Discount',
                item_type: 'discount',
                quantity: 2,
                unit_price: -15.00, // Negative with quantity
                total_price: -30.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple fees
            {
                id: 'fee-1',
                description: 'Environmental Fee',
                item_type: 'fee',
                quantity: 1,
                unit_price: 10.00,
                total_price: 10.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'fee-2',
                description: 'Hazardous Waste Fee',
                item_type: 'fee',
                quantity: 2,
                unit_price: 15.00,
                total_price: 30.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'fee-3',
                description: 'Shop Supplies Fee',
                item_type: 'fee',
                quantity: 1,
                unit_price: 25.00,
                total_price: 25.00,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },

            // Multiple packages
            {
                id: 'pkg-1',
                description: 'Complete Engine Package',
                item_type: 'package',
                quantity: 1,
                unit_price: 999.99,
                total_price: 999.99,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'pkg-2',
                description: 'Transmission Service Package',
                item_type: 'package',
                quantity: 1,
                unit_price: 399.99,
                total_price: 399.99,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'pkg-3',
                description: 'Maintenance Package',
                item_type: 'package',
                quantity: 2,
                unit_price: 199.99,
                total_price: 399.98,
                work_order_id: 'wo-2',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Calculate expected totals:
        // Labor: (12 * 120) + (8 * 110) + (5 * 90) = 1440 + 880 + 450 = 2770
        // Service: (1 * 149.99) + (1 * 299.99) = 149.99 + 299.99 = 449.98
        // Parts: (1 * 89.99) + (4 * 45.00) + (6 * 24.99) + (2 * 12.99) + (8 * 8.99) = 89.99 + 180 + 149.94 + 25.98 + 71.92 = 517.83
        // Expenses: 0 (excluded from subtotal)
        // Fees: (1 * 10.00) + (2 * 15.00) + (1 * 25.00) = 10 + 30 + 25 = 65
        // Packages: (1 * 999.99) + (1 * 399.99) + (2 * 199.99) = 999.99 + 399.99 + 399.98 = 1799.96
        // Discounts: Math.abs(200) + Math.abs(-100) + (3 * Math.abs(25)) + (2 * Math.abs(-15)) = 200 + 100 + 75 + 30 = 405
        // Subtotal = 2770 + 449.98 + 517.83 + 65 + 1799.96 - 405 = 5197.77

        expect(result.labourTotal).toBeCloseTo(2770.00, 2)
        expect(result.servicesTotal).toBeCloseTo(449.98, 2)
        expect(result.partsTotal).toBeCloseTo(517.83, 2)
        expect(result.expensesTotal).toBe(0) // Expenses excluded
        expect(result.feesTotal).toBeCloseTo(65.00, 2)
        expect(result.packagesTotal).toBeCloseTo(1799.96, 2)
        expect(result.discountsTotal).toBeCloseTo(405.00, 2) // All discounts use absolute values
        expect(result.subtotal).toBeCloseTo(5197.77, 2)

        // Verify all items are properly categorized
        expect(result.labourItems).toHaveLength(3)
        expect(result.servicesItems).toHaveLength(2)
        expect(result.partsItems).toHaveLength(5)
        expect(result.expensesItems).toHaveLength(3) // Tracked but excluded from subtotal
        expect(result.feesItems).toHaveLength(3)
        expect(result.packagesItems).toHaveLength(3)
        expect(result.discountsItems).toHaveLength(4)
        expect(result.approvedItems).toHaveLength(23) // All items are active
        expect(result.rejectedItems).toHaveLength(0)
    })

    test('should handle complex invoice with all discount types and edge cases', () => {
        const items: WorkOrderItem[] = [
            // Base items
            {
                id: 'svc-1',
                description: 'Service',
                item_type: 'service',
                quantity: 1,
                unit_price: 1000.00,
                total_price: 1000.00,
                work_order_id: 'wo-3',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },

            // All discount scenarios
            {
                id: 'disc-1',
                description: 'Positive Discount Single',
                item_type: 'discount',
                quantity: 1,
                unit_price: 50.00,
                total_price: 50.00,
                work_order_id: 'wo-3',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-2',
                description: 'Negative Discount Single',
                item_type: 'discount',
                quantity: 1,
                unit_price: -30.00,
                total_price: -30.00,
                work_order_id: 'wo-3',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-3',
                description: 'Positive Discount Multiple Quantity',
                item_type: 'discount',
                quantity: 3,
                unit_price: 10.00,
                total_price: 30.00,
                work_order_id: 'wo-3',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-4',
                description: 'Negative Discount Multiple Quantity',
                item_type: 'discount',
                quantity: 2,
                unit_price: -15.00,
                total_price: -30.00,
                work_order_id: 'wo-3',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-5',
                description: 'Zero Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 0,
                total_price: 0,
                work_order_id: 'wo-3',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-6',
                description: 'Large Positive Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: 200.00,
                total_price: 200.00,
                work_order_id: 'wo-3',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            },
            {
                id: 'disc-7',
                description: 'Large Negative Discount',
                item_type: 'discount',
                quantity: 1,
                unit_price: -100.00,
                total_price: -100.00,
                work_order_id: 'wo-3',
                shop_id: 'shop-1',
                active: true,
                created_at: '2024-01-30T10:00:00Z'
            }
        ]

        const result = calculateInvoiceTotals(items)

        // Discounts total = Math.abs(50) + Math.abs(-30) + (3 * Math.abs(10)) + (2 * Math.abs(-15)) + Math.abs(0) + Math.abs(200) + Math.abs(-100)
        // = 50 + 30 + 30 + 30 + 0 + 200 + 100 = 440
        // Subtotal = 1000 - 440 = 560
        expect(result.discountsTotal).toBeCloseTo(440.00, 2)
        expect(result.servicesTotal).toBeCloseTo(1000.00, 2)
        expect(result.subtotal).toBeCloseTo(560.00, 2)
        expect(result.discountsItems).toHaveLength(7)
    })
})
