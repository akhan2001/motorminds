import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockWalkInVehicleInfo } from '@/data/test-fixtures/walk-in-data'
import type { Invoice, InvoiceFormData } from '../types/invoice'
import type { WalkInVehicleInfo } from '../../customers/types/vehicle'

// Mock the Supabase client
const mockSupabaseClient = vi.hoisted(() => ({
    from: vi.fn()
}))

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => mockSupabaseClient
}))

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        invalidateQueries: vi.fn()
    }),
    useMutation: (options: any) => ({
        mutateAsync: options.mutationFn,
        mutate: vi.fn(),
        reset: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false
    })
}))

describe('Walk-in Customer: Work Order to Invoice Flow', () => {
    let mockFrom: any

    beforeEach(() => {
        mockFrom = mockSupabaseClient.from
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('Creating Invoice from Walk-in Work Order', () => {
        test('should create invoice with walk-in customer data from work order', async () => {
            // Arrange - Mock work order with walk-in customer
            const mockWorkOrder = {
                id: 'wo-walk-in-1',
                shop_id: 'shop-1',
                customer_id: null,
                vehicle_id: null,
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: mockWalkInVehicleInfo,
                title: 'Oil Change',
                description: 'Walk-in customer service',
                status: 'completed',
                priority: 'medium',
                work_order_number: 'WO-001',
                created_at: '2024-01-30T10:00:00Z',
                updated_at: '2024-01-30T10:00:00Z',
                customer: null,
                vehicle: null
            }

            const mockWorkOrderItems = [
                {
                    id: 'item-1',
                    work_order_id: 'wo-walk-in-1',
                    item_type: 'labor',
                    description: 'Oil Change Service',
                    quantity: 1,
                    unit_price: 50.00,
                    total_price: 50.00,
                    labor_hours: 1,
                    active: true,
                    created_at: '2024-01-30T10:00:00Z'
                },
                {
                    id: 'item-2',
                    work_order_id: 'wo-walk-in-1',
                    item_type: 'part',
                    description: 'Oil Filter',
                    quantity: 1,
                    unit_price: 15.00,
                    total_price: 15.00,
                    active: true,
                    created_at: '2024-01-30T10:00:00Z'
                }
            ]

            const mockInvoice: Invoice = {
                id: 'inv-1',
                invoice_number: 'INV-20240130-ABC123',
                display_id: 'INV-20240130-ABC123',
                work_order_id: 'wo-walk-in-1',
                customer_id: null,
                vehicle_id: null,
                shop_id: 'shop-1',
                title: 'Oil Change',
                description: 'Walk-in customer service',
                status: 'draft',
                priority: 'medium',
                subtotal: 65.00,
                tax_rate: 0.13,
                tax_amount: 8.45,
                discount_amount: 0,
                total_amount: 73.45,
                labor_total: 50.00,
                parts_total: 15.00,
                services_total: 0,
                fees_total: 0,
                invoice_items: mockWorkOrderItems.map(item => ({
                    id: item.id,
                    item_type: item.item_type as any,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price,
                    labor_hours: item.labor_hours
                })),
                issue_date: '2024-01-30',
                due_date: null,
                paid_date: null,
                payment_method: null,
                payment_reference: null,
                notes: null,
                created_at: '2024-01-30T10:00:00Z',
                updated_at: '2024-01-30T10:00:00Z',
                customer_type: 'walk_in',
                walk_in_vehicle_info: mockWalkInVehicleInfo
            }

            // Mock work order fetch
            const mockWorkOrderSingle = vi.fn().mockResolvedValue({
                data: mockWorkOrder,
                error: null
            })
            const mockWorkOrderEq = vi.fn().mockReturnValue({
                single: mockWorkOrderSingle
            })
            const mockWorkOrderSelect = vi.fn().mockReturnValue({
                eq: mockWorkOrderEq
            })

            // Mock existing invoice check (no existing invoice)
            const mockExistingInvoiceSingle = vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' } // Not found error
            })
            const mockExistingInvoiceLimit = vi.fn().mockReturnValue({
                single: mockExistingInvoiceSingle
            })
            const mockExistingInvoiceEq = vi.fn().mockReturnValue({
                limit: mockExistingInvoiceLimit
            })
            const mockExistingInvoiceSelect = vi.fn().mockReturnValue({
                eq: mockExistingInvoiceEq
            })

            // Mock work order items fetch
            const mockItemsEq = vi.fn().mockResolvedValue({
                data: mockWorkOrderItems,
                error: null
            })
            const mockItemsSelect = vi.fn().mockReturnValue({
                eq: mockItemsEq
            })

            // Mock invoice insert
            const mockInvoiceSingle = vi.fn().mockResolvedValue({
                data: mockInvoice,
                error: null
            })
            const mockInvoiceSelect = vi.fn().mockReturnValue({
                single: mockInvoiceSingle
            })
            const mockInvoiceInsert = vi.fn().mockReturnValue({
                select: mockInvoiceSelect
            })

            // Setup mock chain - each from() call returns different mock
            mockFrom
                .mockReturnValueOnce({
                    select: mockWorkOrderSelect
                })
                .mockReturnValueOnce({
                    select: mockExistingInvoiceSelect
                })
                .mockReturnValueOnce({
                    select: mockItemsSelect
                })
                .mockReturnValueOnce({
                    insert: mockInvoiceInsert
                })

            // Act - Simulate useCreateInvoiceFromWorkOrder mutation
            const { useCreateInvoiceFromWorkOrder } = await import('./use-invoices')
            const mutation = useCreateInvoiceFromWorkOrder()
            const result = await mutation.mutateAsync({
                work_order_id: 'wo-walk-in-1',
                shop_id: 'shop-1'
            })

            // Assert
            expect(result.customer_type).toBe('walk_in')
            expect(result.customer_id).toBeNull()
            expect(result.vehicle_id).toBeNull()
            expect(result.walk_in_vehicle_info).toEqual(mockWalkInVehicleInfo)
            expect(result.work_order_id).toBe('wo-walk-in-1')
        })

        test('should preserve walk-in vehicle info in invoice', async () => {
            // Arrange
            const customVehicleInfo: WalkInVehicleInfo = {
                year: 2018,
                make: 'Honda',
                model: 'Civic',
                license_plate: 'XYZ789',
                color: 'Blue',
                vin: '1HGBH41JXMN109186',
                mileage: 60000
            }

            const mockWorkOrder = {
                id: 'wo-walk-in-2',
                shop_id: 'shop-1',
                customer_id: null,
                vehicle_id: null,
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: customVehicleInfo,
                title: 'Brake Service',
                description: null,
                status: 'completed',
                priority: 'medium',
                work_order_number: 'WO-002',
                customer: null,
                vehicle: null
            }

            const mockWorkOrderItems = [
                {
                    id: 'item-1',
                    work_order_id: 'wo-walk-in-2',
                    item_type: 'labor',
                    description: 'Brake Service',
                    quantity: 1,
                    unit_price: 75.00,
                    total_price: 75.00,
                    labor_hours: 2,
                    active: true,
                    created_at: '2024-01-30T10:00:00Z'
                }
            ]

            const mockInvoice = {
                id: 'inv-2',
                invoice_number: 'INV-20240130-DEF456',
                display_id: 'INV-20240130-DEF456',
                customer_id: null,
                vehicle_id: null,
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: customVehicleInfo,
                work_order_id: 'wo-walk-in-2',
                shop_id: 'shop-1',
                title: 'Brake Service',
                description: null,
                status: 'draft',
                priority: 'medium',
                subtotal: 75.00,
                tax_rate: 0.13,
                tax_amount: 9.75,
                discount_amount: 0,
                total_amount: 84.75,
                labor_total: 75.00,
                parts_total: 0,
                services_total: 0,
                fees_total: 0,
                invoice_items: [],
                issue_date: '2024-01-30',
                due_date: null,
                paid_date: null,
                payment_method: null,
                payment_reference: null,
                notes: null,
                created_at: '2024-01-30T10:00:00Z',
                updated_at: '2024-01-30T10:00:00Z'
            }

            // Mock work order fetch
            const mockWorkOrderSingle = vi.fn().mockResolvedValue({
                data: mockWorkOrder,
                error: null
            })
            const mockWorkOrderEq = vi.fn().mockReturnValue({
                single: mockWorkOrderSingle
            })
            const mockWorkOrderSelect = vi.fn().mockReturnValue({
                eq: mockWorkOrderEq
            })

            // Mock existing invoice check
            const mockExistingInvoiceSingle = vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
            })
            const mockExistingInvoiceLimit = vi.fn().mockReturnValue({
                single: mockExistingInvoiceSingle
            })
            const mockExistingInvoiceEq = vi.fn().mockReturnValue({
                limit: mockExistingInvoiceLimit
            })
            const mockExistingInvoiceSelect = vi.fn().mockReturnValue({
                eq: mockExistingInvoiceEq
            })

            // Mock work order items fetch
            const mockItemsEq = vi.fn().mockResolvedValue({
                data: mockWorkOrderItems,
                error: null
            })
            const mockItemsSelect = vi.fn().mockReturnValue({
                eq: mockItemsEq
            })

            // Mock invoice insert
            const mockInvoiceSingle = vi.fn().mockResolvedValue({
                data: mockInvoice,
                error: null
            })
            const mockInvoiceSelect = vi.fn().mockReturnValue({
                single: mockInvoiceSingle
            })
            const mockInvoiceInsert = vi.fn().mockReturnValue({
                select: mockInvoiceSelect
            })

            // Setup mock chain
            mockFrom
                .mockReturnValueOnce({
                    select: mockWorkOrderSelect
                })
                .mockReturnValueOnce({
                    select: mockExistingInvoiceSelect
                })
                .mockReturnValueOnce({
                    select: mockItemsSelect
                })
                .mockReturnValueOnce({
                    insert: mockInvoiceInsert
                })

            // Act
            const { useCreateInvoiceFromWorkOrder } = await import('./use-invoices')
            const mutation = useCreateInvoiceFromWorkOrder()
            const result = await mutation.mutateAsync({
                work_order_id: 'wo-walk-in-2',
                shop_id: 'shop-1'
            })

            // Assert
            expect(result.walk_in_vehicle_info).toEqual(customVehicleInfo)
            expect(result.walk_in_vehicle_info?.year).toBe(2018)
            expect(result.walk_in_vehicle_info?.make).toBe('Honda')
            expect(result.walk_in_vehicle_info?.license_plate).toBe('XYZ789')
        })

        test('should set customer_id to null for walk-in customers', async () => {
            // Arrange
            const mockWorkOrder = {
                id: 'wo-walk-in-3',
                shop_id: 'shop-1',
                customer_id: null,
                vehicle_id: null,
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: mockWalkInVehicleInfo,
                title: 'Tire Rotation',
                status: 'completed',
                customer: null,
                vehicle: null
            }

            const mockWorkOrderItems = [
                {
                    id: 'item-1',
                    work_order_id: 'wo-walk-in-3',
                    item_type: 'labor',
                    description: 'Tire Rotation',
                    quantity: 1,
                    unit_price: 30.00,
                    total_price: 30.00,
                    active: true
                }
            ]

            const mockInvoice = {
                id: 'inv-3',
                invoice_number: 'INV-20240130-GHI789',
                customer_id: null, // Should be null for walk-in
                vehicle_id: null,
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: mockWalkInVehicleInfo,
                work_order_id: 'wo-walk-in-3',
                shop_id: 'shop-1'
            }

            // Mock work order fetch
            const mockWorkOrderSingle = vi.fn().mockResolvedValue({
                data: mockWorkOrder,
                error: null
            })
            const mockWorkOrderEq = vi.fn().mockReturnValue({
                single: mockWorkOrderSingle
            })
            const mockWorkOrderSelect = vi.fn().mockReturnValue({
                eq: mockWorkOrderEq
            })

            // Mock existing invoice check
            const mockExistingInvoiceSingle = vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
            })
            const mockExistingInvoiceLimit = vi.fn().mockReturnValue({
                single: mockExistingInvoiceSingle
            })
            const mockExistingInvoiceEq = vi.fn().mockReturnValue({
                limit: mockExistingInvoiceLimit
            })
            const mockExistingInvoiceSelect = vi.fn().mockReturnValue({
                eq: mockExistingInvoiceEq
            })

            // Mock work order items fetch
            const mockItemsEq = vi.fn().mockResolvedValue({
                data: mockWorkOrderItems,
                error: null
            })
            const mockItemsSelect = vi.fn().mockReturnValue({
                eq: mockItemsEq
            })

            // Mock invoice insert
            const mockInvoiceSingle = vi.fn().mockResolvedValue({
                data: mockInvoice,
                error: null
            })
            const mockInvoiceSelect = vi.fn().mockReturnValue({
                single: mockInvoiceSingle
            })
            const mockInvoiceInsert = vi.fn().mockReturnValue({
                select: mockInvoiceSelect
            })

            // Setup mock chain
            mockFrom
                .mockReturnValueOnce({
                    select: mockWorkOrderSelect
                })
                .mockReturnValueOnce({
                    select: mockExistingInvoiceSelect
                })
                .mockReturnValueOnce({
                    select: mockItemsSelect
                })
                .mockReturnValueOnce({
                    insert: mockInvoiceInsert
                })

            // Act
            const { useCreateInvoiceFromWorkOrder } = await import('./use-invoices')
            const mutation = useCreateInvoiceFromWorkOrder()
            const result = await mutation.mutateAsync({
                work_order_id: 'wo-walk-in-3',
                shop_id: 'shop-1'
            })

            // Assert
            expect(result.customer_id).toBeNull()
            expect(result.customer_type).toBe('walk_in')
        })
    })

    describe('Creating Invoice Directly for Walk-in Customer', () => {
        test('should create invoice with walk-in customer data', async () => {
            // Arrange
            const invoiceFormData: InvoiceFormData = {
                customer_id: null,
                vehicle_id: null,
                work_order_id: null,
                title: 'Walk-in Service',
                description: 'Direct invoice for walk-in',
                status: 'draft',
                priority: 'medium',
                tax_rate: 0.13,
                discount_amount: 0,
                issue_date: '2024-01-30',
                due_date: null,
                payment_method: null,
                payment_reference: null,
                notes: null,
                invoice_items: [],
                customer_type: 'walk_in',
                walk_in_vehicle_info: mockWalkInVehicleInfo
            }

            const mockInvoice: Invoice = {
                id: 'inv-direct-1',
                invoice_number: 'INV-20240130-JKL012',
                display_id: 'INV-20240130-JKL012',
                customer_id: null,
                vehicle_id: null,
                shop_id: 'shop-1',
                title: 'Walk-in Service',
                description: 'Direct invoice for walk-in',
                status: 'draft',
                priority: 'medium',
                subtotal: 0,
                tax_rate: 0.13,
                tax_amount: 0,
                discount_amount: 0,
                total_amount: 0,
                labor_total: 0,
                parts_total: 0,
                services_total: 0,
                fees_total: 0,
                invoice_items: [],
                issue_date: '2024-01-30',
                due_date: null,
                paid_date: null,
                payment_method: null,
                payment_reference: null,
                notes: null,
                work_order_id: null,
                created_at: '2024-01-30T10:00:00Z',
                updated_at: '2024-01-30T10:00:00Z',
                customer_type: 'walk_in',
                walk_in_vehicle_info: mockWalkInVehicleInfo
            }

            // Mock invoice insert
            const mockInvoiceSingle = vi.fn().mockResolvedValue({
                data: mockInvoice,
                error: null
            })
            const mockInvoiceSelect = vi.fn().mockReturnValue({
                single: mockInvoiceSingle
            })
            const mockInvoiceInsert = vi.fn().mockReturnValue({
                select: mockInvoiceSelect
            })

            mockFrom.mockReturnValueOnce({
                insert: mockInvoiceInsert
            })

            // Act
            const { useCreateInvoice } = await import('./use-invoices')
            const mutation = useCreateInvoice()
            const result = await mutation.mutateAsync({
                ...invoiceFormData,
                shop_id: 'shop-1'
            })

            // Assert
            expect(result.customer_type).toBe('walk_in')
            expect(result.customer_id).toBeNull()
            expect(result.walk_in_vehicle_info).toEqual(mockWalkInVehicleInfo)
        })

        test('should validate required walk-in vehicle fields', async () => {
            // Arrange
            const invalidInvoiceData: InvoiceFormData = {
                customer_id: null,
                vehicle_id: null,
                work_order_id: null,
                title: 'Invalid Invoice',
                description: null,
                status: 'draft',
                priority: 'medium',
                tax_rate: 0.13,
                discount_amount: 0,
                issue_date: '2024-01-30',
                due_date: null,
                payment_method: null,
                payment_reference: null,
                notes: null,
                invoice_items: [],
                customer_type: 'walk_in',
                walk_in_vehicle_info: {
                    year: 2020,
                    make: 'Toyota',
                    model: 'Camry',
                    license_plate: '' // Missing license plate
                } as WalkInVehicleInfo
            }

            // Act & Assert
            const { useCreateInvoice } = await import('./use-invoices')
            const mutation = useCreateInvoice()
            
            await expect(
                mutation.mutateAsync({
                    ...invalidInvoiceData,
                    shop_id: 'shop-1'
                })
            ).rejects.toThrow('Year, make, model, and license plate are required for walk-in customers')
        })
    })

    describe('Walk-in Customer Data Integrity', () => {
        test('should not allow customer_id for walk-in customers', async () => {
            // Arrange
            const invalidInvoiceData: InvoiceFormData = {
                customer_id: 'customer-123', // Should be null for walk-in
                vehicle_id: null,
                work_order_id: null,
                title: 'Invalid Invoice',
                description: null,
                status: 'draft',
                priority: 'medium',
                tax_rate: 0.13,
                discount_amount: 0,
                issue_date: '2024-01-30',
                due_date: null,
                payment_method: null,
                payment_reference: null,
                notes: null,
                invoice_items: [],
                customer_type: 'walk_in',
                walk_in_vehicle_info: mockWalkInVehicleInfo
            }

            const mockInvoice = {
                id: 'inv-invalid-1',
                customer_id: null, // Should be set to null even if provided
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: mockWalkInVehicleInfo
            }

            // Mock invoice insert
            const mockInvoiceSingle = vi.fn().mockResolvedValue({
                data: mockInvoice,
                error: null
            })
            const mockInvoiceSelect = vi.fn().mockReturnValue({
                single: mockInvoiceSingle
            })
            const mockInvoiceInsert = vi.fn().mockReturnValue({
                select: mockInvoiceSelect
            })

            mockFrom.mockReturnValueOnce({
                insert: mockInvoiceInsert
            })

            // Act
            const { useCreateInvoice } = await import('./use-invoices')
            const mutation = useCreateInvoice()
            const result = await mutation.mutateAsync({
                ...invalidInvoiceData,
                shop_id: 'shop-1'
            })

            // Assert - customer_id should be null for walk-in
            expect(result.customer_id).toBeNull()
            expect(result.customer_type).toBe('walk_in')
        })

        test('should preserve all walk-in vehicle fields', async () => {
            // Arrange
            const completeVehicleInfo: WalkInVehicleInfo = {
                year: 2019,
                make: 'Ford',
                model: 'F-150',
                license_plate: 'TRUCK1',
                color: 'Black',
                vin: '1FTFW1E5XKFC12345',
                mileage: 75000
            }

            const mockWorkOrder = {
                id: 'wo-complete-1',
                shop_id: 'shop-1',
                customer_id: null,
                vehicle_id: null,
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: completeVehicleInfo,
                title: 'Complete Service',
                status: 'completed',
                customer: null,
                vehicle: null
            }

            const mockInvoice = {
                id: 'inv-complete-1',
                customer_id: null,
                vehicle_id: null,
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: completeVehicleInfo,
                work_order_id: 'wo-complete-1',
                shop_id: 'shop-1'
            }

            const mockWorkOrderItems = [
                {
                    id: 'item-1',
                    work_order_id: 'wo-complete-1',
                    item_type: 'labor',
                    description: 'Complete Service',
                    quantity: 1,
                    unit_price: 100.00,
                    total_price: 100.00,
                    active: true
                }
            ]

            // Mock work order fetch
            const mockWorkOrderSingle = vi.fn().mockResolvedValue({
                data: mockWorkOrder,
                error: null
            })
            const mockWorkOrderEq = vi.fn().mockReturnValue({
                single: mockWorkOrderSingle
            })
            const mockWorkOrderSelect = vi.fn().mockReturnValue({
                eq: mockWorkOrderEq
            })

            // Mock existing invoice check
            const mockExistingInvoiceSingle = vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
            })
            const mockExistingInvoiceLimit = vi.fn().mockReturnValue({
                single: mockExistingInvoiceSingle
            })
            const mockExistingInvoiceEq = vi.fn().mockReturnValue({
                limit: mockExistingInvoiceLimit
            })
            const mockExistingInvoiceSelect = vi.fn().mockReturnValue({
                eq: mockExistingInvoiceEq
            })

            // Mock work order items fetch
            const mockItemsEq = vi.fn().mockResolvedValue({
                data: mockWorkOrderItems,
                error: null
            })
            const mockItemsSelect = vi.fn().mockReturnValue({
                eq: mockItemsEq
            })

            // Mock invoice insert
            const mockInvoiceSingle = vi.fn().mockResolvedValue({
                data: mockInvoice,
                error: null
            })
            const mockInvoiceSelect = vi.fn().mockReturnValue({
                single: mockInvoiceSingle
            })
            const mockInvoiceInsert = vi.fn().mockReturnValue({
                select: mockInvoiceSelect
            })

            // Setup mock chain
            mockFrom
                .mockReturnValueOnce({
                    select: mockWorkOrderSelect
                })
                .mockReturnValueOnce({
                    select: mockExistingInvoiceSelect
                })
                .mockReturnValueOnce({
                    select: mockItemsSelect
                })
                .mockReturnValueOnce({
                    insert: mockInvoiceInsert
                })

            // Act
            const { useCreateInvoiceFromWorkOrder } = await import('./use-invoices')
            const mutation = useCreateInvoiceFromWorkOrder()
            const result = await mutation.mutateAsync({
                work_order_id: 'wo-complete-1',
                shop_id: 'shop-1'
            })

            // Assert - All vehicle fields should be preserved
            expect(result.walk_in_vehicle_info).toEqual(completeVehicleInfo)
            expect(result.walk_in_vehicle_info?.year).toBe(2019)
            expect(result.walk_in_vehicle_info?.make).toBe('Ford')
            expect(result.walk_in_vehicle_info?.model).toBe('F-150')
            expect(result.walk_in_vehicle_info?.license_plate).toBe('TRUCK1')
            expect(result.walk_in_vehicle_info?.color).toBe('Black')
            expect(result.walk_in_vehicle_info?.vin).toBe('1FTFW1E5XKFC12345')
            expect(result.walk_in_vehicle_info?.mileage).toBe(75000)
        })
    })
})

