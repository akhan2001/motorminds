import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import type { WorkOrderService as WorkOrderServiceType } from './work-order-service'
import { mockWalkInVehicleInfo, mockWorkOrderData } from '@/data/test-fixtures/walk-in-data'
import type { WorkOrder, WorkOrderWithDetails, WorkOrderItem, WorkOrderStatus } from '../types/work-order'
import type { WalkInVehicleInfo } from '../../customers/types/vehicle'

// Mock the Supabase client (hoisted so it's available inside vi.mock factory)
const mockSupabaseClient = vi.hoisted(() => ({
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                single: vi.fn(),
                order: vi.fn(() => ({
                    limit: vi.fn()
                }))
            })),
            in: vi.fn(() => ({
                order: vi.fn()
            })),
            or: vi.fn(() => ({
                order: vi.fn()
            })),
            order: vi.fn()
        })),
        insert: vi.fn(() => ({
            select: vi.fn(() => ({
                single: vi.fn()
            }))
        })),
        update: vi.fn(() => ({
            eq: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn()
                }))
            }))
        })),
        delete: vi.fn(() => ({
            eq: vi.fn()
        }))
    }))
}))

vi.mock('@/lib/supabase', () => ({
    createClient: () => mockSupabaseClient
}))

describe('WorkOrderService', () => {
    let service: WorkOrderServiceType
    let mockFrom: any

    beforeEach(async () => {
        const mod = await import('./work-order-service')
        const { WorkOrderService } = mod
        service = new WorkOrderService()
        mockFrom = mockSupabaseClient.from
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('Walk-in Customer Operations', () => {
    test('should create walk-in work order successfully', async () => {
            // Arrange
            const mockWorkOrder = {
                id: 'test-id',
                created_at: '2024-01-29T10:00:00Z',
                updated_at: '2024-01-29T10:00:00Z',
                ...mockWorkOrderData,
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: mockWalkInVehicleInfo,
                customer_id: null,
                vehicle_id: null
            }

            // Mock the createWorkOrder method
            vi.spyOn(service, 'createWorkOrder').mockResolvedValue(mockWorkOrder)

            // Act
            const result = await service.createWalkInWorkOrder({
                workOrder: mockWorkOrderData,
                walkInVehicleInfo: mockWalkInVehicleInfo
            })

            // Assert
            expect(result.customer_type).toBe('walk_in')
            expect(result.walk_in_vehicle_info).toEqual(mockWalkInVehicleInfo)
            expect(result.customer_id).toBeNull()
            expect(result.vehicle_id).toBeNull()
            expect(service.createWorkOrder).toHaveBeenCalledWith({
                ...mockWorkOrderData,
                customer_type: 'walk_in',
                walk_in_vehicle_info: mockWalkInVehicleInfo,
                customer_id: null,
                vehicle_id: null
            })
        })

        test('should throw error for missing year', async () => {
            // Arrange
            const invalidVehicleInfo = {
                ...mockWalkInVehicleInfo,
                year: undefined as any
            }

            // Act & Assert
            await expect(service.createWalkInWorkOrder({
                workOrder: mockWorkOrderData,
                walkInVehicleInfo: invalidVehicleInfo
            })).rejects.toThrow('Year, make, model, and license plate are required for walk-in customers')
        })

        test('should throw error for missing make', async () => {
            // Arrange
            const invalidVehicleInfo = {
                ...mockWalkInVehicleInfo,
                make: ''
            }

            // Act & Assert
            await expect(service.createWalkInWorkOrder({
                workOrder: mockWorkOrderData,
                walkInVehicleInfo: invalidVehicleInfo
            })).rejects.toThrow('Year, make, model, and license plate are required for walk-in customers')
        })

        test('should throw error for missing model', async () => {
            // Arrange
            const invalidVehicleInfo = {
                ...mockWalkInVehicleInfo,
                model: ''
            }

            // Act & Assert
            await expect(service.createWalkInWorkOrder({
                workOrder: mockWorkOrderData,
                walkInVehicleInfo: invalidVehicleInfo
            })).rejects.toThrow('Year, make, model, and license plate are required for walk-in customers')
        })

        test('should throw error for missing license plate', async () => {
            // Arrange
            const invalidVehicleInfo = {
                ...mockWalkInVehicleInfo,
                license_plate: ''
            }

            // Act & Assert
            await expect(service.createWalkInWorkOrder({
                workOrder: mockWorkOrderData,
                walkInVehicleInfo: invalidVehicleInfo
            })).rejects.toThrow('Year, make, model, and license plate are required for walk-in customers')
        })

        test('should handle optional vehicle fields', async () => {
            // Arrange
            const vehicleInfoWithOptionals = {
                year: 2020,
                make: 'Toyota',
                model: 'Camry',
                license_plate: 'ABC123',
                color: 'Silver',
                vin: '1HGBH41JXMN109186',
                mileage: 45000
            }

            const mockWorkOrder = {
                id: 'test-id',
                created_at: '2024-01-29T10:00:00Z',
                updated_at: '2024-01-29T10:00:00Z',
                ...mockWorkOrderData,
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: vehicleInfoWithOptionals,
                customer_id: null,
                vehicle_id: null
            }

            vi.spyOn(service, 'createWorkOrder').mockResolvedValue(mockWorkOrder)

            // Act
            const result = await service.createWalkInWorkOrder({
                workOrder: mockWorkOrderData,
                walkInVehicleInfo: vehicleInfoWithOptionals
            })

            // Assert
            expect(result.walk_in_vehicle_info).toEqual(vehicleInfoWithOptionals)
            expect(result.walk_in_vehicle_info?.color).toBe('Silver')
            expect(result.walk_in_vehicle_info?.vin).toBe('1HGBH41JXMN109186')
            expect(result.walk_in_vehicle_info?.mileage).toBe(45000)
        })

        test('should handle minimal required fields only', async () => {
            // Arrange
            const minimalVehicleInfo = {
                year: 2020,
                make: 'Toyota',
                model: 'Camry',
                license_plate: 'ABC123'
            }

            const mockWorkOrder = {
                id: 'test-id',
                created_at: '2024-01-29T10:00:00Z',
                updated_at: '2024-01-29T10:00:00Z',
                ...mockWorkOrderData,
                customer_type: 'walk_in' as const,
                walk_in_vehicle_info: minimalVehicleInfo,
                customer_id: null,
                vehicle_id: null
            }

            vi.spyOn(service, 'createWorkOrder').mockResolvedValue(mockWorkOrder)

            // Act
            const result = await service.createWalkInWorkOrder({
                workOrder: mockWorkOrderData,
                walkInVehicleInfo: minimalVehicleInfo
            })

            // Assert
            expect(result.walk_in_vehicle_info).toEqual(minimalVehicleInfo)
            expect(result.customer_type).toBe('walk_in')
        })
    })

    describe('CRUD Operations', () => {
        describe('getWorkOrders', () => {
            test('should fetch work orders successfully', async () => {
                // Arrange
                const mockWorkOrders = [
                    { id: '1', title: 'Oil Change', shop_id: 'shop-1' },
                    { id: '2', title: 'Brake Repair', shop_id: 'shop-1' }
                ]
                const mockQuery = {
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({ data: mockWorkOrders, error: null })
                }
                mockFrom.mockReturnValue({
                    select: vi.fn().mockReturnValue(mockQuery)
                })

                // Act
                const result = await service.getWorkOrders('shop-1')

                // Assert
                expect(result).toEqual(mockWorkOrders)
                expect(mockFrom).toHaveBeenCalledWith('work_orders')
                expect(mockQuery.eq).toHaveBeenCalledWith('shop_id', 'shop-1')
            })

            test('should handle database error', async () => {
                // Arrange
                const mockQuery = {
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
                }
                mockFrom.mockReturnValue({
                    select: vi.fn().mockReturnValue(mockQuery)
                })

                // Act & Assert
                await expect(service.getWorkOrders('shop-1')).rejects.toThrow('Failed to fetch work orders: Database error')
            })

            test('should return empty array when no data', async () => {
                // Arrange
                const mockQuery = {
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockResolvedValue({ data: null, error: null })
                }
                mockFrom.mockReturnValue({
                    select: vi.fn().mockReturnValue(mockQuery)
                })

                // Act
                const result = await service.getWorkOrders('shop-1')

                // Assert
                expect(result).toEqual([])
            })
        })

        describe('getWorkOrderById', () => {
            test('should fetch work order by id successfully', async () => {
                // Arrange
                const mockWorkOrder = { id: '1', title: 'Oil Change' }
                const mockQuery = {
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: mockWorkOrder, error: null })
                }
                mockFrom.mockReturnValue({
                    select: vi.fn().mockReturnValue(mockQuery)
                })

                // Act
                const result = await service.getWorkOrderById('1')

                // Assert
                expect(result).toEqual(mockWorkOrder)
                expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
            })

            test('should return null when work order not found', async () => {
                // Arrange
                const mockQuery = {
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                }
                mockFrom.mockReturnValue({
                    select: vi.fn().mockReturnValue(mockQuery)
                })

                // Act
                const result = await service.getWorkOrderById('1')

                // Assert
                expect(result).toBeNull()
            })
        })

        describe('createWorkOrder', () => {
            test('should create work order successfully', async () => {
                // Arrange
                const workOrderData = {
                    work_order_number: 'WO-0001',
                    title: 'Oil Change',
                    description: 'Regular maintenance',
                    status: 'pending' as WorkOrderStatus,
                    priority: 'medium' as const,
                    shop_id: 'shop-1',
                    customer_id: 'customer-1',
                    vehicle_id: 'vehicle-1',
                    customer_type: 'registered' as const,
                    walk_in_vehicle_info: undefined,
                    assigned_technician_id: undefined,
                    appointment_id: undefined,
                    invoice_id: undefined,
                    started_at: undefined,
                    completed_at: undefined,
                    tags: [],
                    attachments: [],
                    notes: undefined
                }
                const mockCreatedWorkOrder = { id: '1', ...workOrderData }
                const mockQuery = {
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: mockCreatedWorkOrder, error: null })
                }
                mockFrom.mockReturnValue({
                    insert: vi.fn().mockReturnValue(mockQuery)
                })

                // Act
                const result = await service.createWorkOrder(workOrderData)

                // Assert
                expect(result).toEqual(mockCreatedWorkOrder)
                expect(mockFrom).toHaveBeenCalledWith('work_orders')
            })

            test('should handle creation error', async () => {
                // Arrange
                const workOrderData = { work_order_number: 'WO-0001', title: 'Oil Change', shop_id: 'shop-1' } as any
                const mockQuery = {
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Creation failed' } })
                }
                mockFrom.mockReturnValue({
                    insert: vi.fn().mockReturnValue(mockQuery)
                })

                // Act & Assert
                await expect(service.createWorkOrder(workOrderData)).rejects.toThrow('Failed to create work order: Creation failed')
            })
        })

        describe('updateWorkOrder', () => {
            test('should update work order successfully', async () => {
                // Arrange
                const updateData = { title: 'Updated Title', status: 'in_progress' as WorkOrderStatus }
                const mockUpdatedWorkOrder = { id: '1', ...updateData, updated_at: '2024-01-29T10:00:00Z' }
                const mockQuery = {
                    eq: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: mockUpdatedWorkOrder, error: null })
                }
                mockFrom.mockReturnValue({
                    update: vi.fn().mockReturnValue(mockQuery)
                })

                // Act
                const result = await service.updateWorkOrder('1', updateData)

                // Assert
                expect(result).toEqual(mockUpdatedWorkOrder)
                expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
            })

            test('should handle update error', async () => {
                // Arrange
                const updateData = { title: 'Updated Title' }
                const mockQuery = {
                    eq: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } })
                }
                mockFrom.mockReturnValue({
                    update: vi.fn().mockReturnValue(mockQuery)
                })

                // Act & Assert
                await expect(service.updateWorkOrder('1', updateData)).rejects.toThrow('Failed to update work order: Update failed')
            })
        })

        describe('deleteWorkOrder', () => {
            test('should delete work order successfully', async () => {
                // Arrange
                const mockSelectQuery = {
                    eq: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({
                            data: { appointment_id: null },
                            error: null
                        })
                    }))
                }
                const mockDeleteQuery = {
                    eq: vi.fn().mockResolvedValue({ error: null })
                }
                mockFrom.mockReturnValue({
                    select: vi.fn(() => mockSelectQuery),
                    delete: vi.fn(() => mockDeleteQuery)
                })

                // Act
                await service.deleteWorkOrder('1')

                // Assert
                expect(mockSelectQuery.eq).toHaveBeenCalledWith('id', '1')
                expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', '1')
            })

            test('should handle delete error', async () => {
                // Arrange
                const mockSelectQuery = {
                    eq: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({
                            data: { appointment_id: null },
                            error: null
                        })
                    }))
                }
                const mockDeleteQuery = {
                    eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } })
                }
                mockFrom.mockReturnValue({
                    select: vi.fn(() => mockSelectQuery),
                    delete: vi.fn(() => mockDeleteQuery)
                })

                // Act & Assert
                await expect(service.deleteWorkOrder('1')).rejects.toThrow('Failed to delete work order: Delete failed')
            })
        })
    })

    describe('Status Management', () => {
        test('should update work order status successfully', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockResolvedValue({ error: null })
            }
            mockFrom.mockReturnValue({
                update: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            await service.updateWorkOrderStatus('1', 'in_progress')

            // Assert
            expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
        })

        test('should set started_at when status is in_progress', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockResolvedValue({ error: null })
            }
            mockFrom.mockReturnValue({
                update: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            await service.updateWorkOrderStatus('1', 'in_progress')

            // Assert
            expect(mockFrom().update).toHaveBeenCalledWith({
                status: 'in_progress',
                updated_at: expect.any(String),
                started_at: expect.any(String)
            })
        })

        test('should set completed_at when status is completed', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockResolvedValue({ error: null })
            }
            mockFrom.mockReturnValue({
                update: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            await service.updateWorkOrderStatus('1', 'completed')

            // Assert
            expect(mockFrom().update).toHaveBeenCalledWith({
                status: 'completed',
                updated_at: expect.any(String),
                completed_at: expect.any(String)
            })
        })

        test('should handle status update error', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockResolvedValue({ error: { message: 'Status update failed' } })
            }
            mockFrom.mockReturnValue({
                update: vi.fn().mockReturnValue(mockQuery)
            })

            // Act & Assert
            await expect(service.updateWorkOrderStatus('1', 'in_progress')).rejects.toThrow('Failed to update work order status: Status update failed')
        })
    })

    describe('Search and Filter Operations', () => {
        test('should search work orders successfully', async () => {
            // Arrange
            const mockWorkOrders = [
                { id: '1', title: 'Oil Change', work_order_number: 'WO-0001' }
            ]
            const mockQuery = {
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockWorkOrders, error: null })
            }
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            const result = await service.searchWorkOrders('shop-1', 'oil')

            // Assert
            expect(result).toEqual(mockWorkOrders)
            expect(mockQuery.or).toHaveBeenCalledWith('title.ilike.%oil%,description.ilike.%oil%,work_order_number.ilike.%oil%')
        })

        test('should get work orders by status', async () => {
            // Arrange
            const mockWorkOrders = [
                { id: '1', title: 'Oil Change', status: 'pending' }
            ]
            const mockQuery = {
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockWorkOrders, error: null })
            }
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            const result = await service.getWorkOrdersByStatus('shop-1', 'pending')

            // Assert
            expect(result).toEqual(mockWorkOrders)
            expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pending')
        })

        test('should get active work orders', async () => {
            // Arrange
            const mockWorkOrders = [
                { id: '1', title: 'Oil Change', status: 'in_progress' }
            ]
            const mockQuery = {
                eq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockWorkOrders, error: null })
            }
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            const result = await service.getActiveWorkOrders('shop-1')

            // Assert
            expect(result).toEqual(mockWorkOrders)
            expect(mockQuery.in).toHaveBeenCalledWith('status', ['pending', 'approved', 'in_progress', 'waiting_parts', 'waiting_customer'])
        })
    })

    describe('Work Order Items', () => {
        test('should create work order item successfully', async () => {
            // Arrange
            const itemData = {
                work_order_id: '1',
                item_type: 'labor' as const,
                description: 'Oil Change',
                quantity: 1,
                unit_price: 50.00,
                total_price: 50.00
            }
            const mockCreatedItem = { id: 'item-1', ...itemData, created_at: '2024-01-29T10:00:00Z' }
            const mockQuery = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCreatedItem, error: null })
            }
            mockFrom.mockReturnValue({
                insert: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            const result = await service.createWorkOrderItem(itemData)

            // Assert
            expect(result).toEqual(mockCreatedItem)
            expect(mockFrom).toHaveBeenCalledWith('work_order_items')
        })

        test('should delete work order item successfully', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockResolvedValue({ error: null })
            }
            mockFrom.mockReturnValue({
                delete: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            await service.deleteWorkOrderItem('item-1')

            // Assert
            expect(mockQuery.eq).toHaveBeenCalledWith('id', 'item-1')
        })
    })

    describe('Work Order Number Generation', () => {
        test('should generate first work order number', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null })
            }
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            const result = await service.generateWorkOrderNumber('shop-1')

            // Assert
            expect(result).toBe('WO-0001')
        })

        test('should generate next work order number', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ 
                    data: [{ work_order_number: 'WO-0005' }], 
                    error: null 
                })
            }
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            const result = await service.generateWorkOrderNumber('shop-1')

            // Assert
            expect(result).toBe('WO-0006')
        })

        test('should handle generation error gracefully', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
            }
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            const result = await service.generateWorkOrderNumber('shop-1')

            // Assert
            expect(result).toBe('WO-0001')
        })
    })

    describe('Work Order with Dependencies', () => {
        test('should create work order with existing customer and vehicle', async () => {
            // Arrange
            const workOrderData = {
                work_order_number: 'WO-0001',
                title: 'Oil Change',
                description: 'Regular maintenance',
                status: 'pending' as WorkOrderStatus,
                priority: 'medium' as const,
                shop_id: 'shop-1',
                customer_type: 'registered' as const,
                walk_in_vehicle_info: undefined,
                assigned_technician_id: undefined,
                appointment_id: undefined,
                invoice_id: undefined,
                started_at: undefined,
                completed_at: undefined,
                tags: [],
                attachments: [],
                notes: undefined
            }
            const customerData = { id: 'customer-1', name: 'John Doe' }
            const vehicleData = { id: 'vehicle-1', year: '2020', make: 'Toyota', model: 'Camry' }
            const mockCreatedWorkOrder = { 
                id: '1', 
                created_at: '2024-01-29T10:00:00Z',
                updated_at: '2024-01-29T10:00:00Z',
                ...workOrderData, 
                customer_id: 'customer-1', 
                vehicle_id: 'vehicle-1',
                customer_type: 'registered' as const,
                walk_in_vehicle_info: undefined
            }

            vi.spyOn(service, 'createWorkOrder').mockResolvedValue(mockCreatedWorkOrder)

            // Act
            const result = await service.createWorkOrderWithDependencies({
                workOrder: workOrderData,
                customer: customerData,
                vehicle: vehicleData
            })

            // Assert
            expect(result).toEqual(mockCreatedWorkOrder)
            expect(service.createWorkOrder).toHaveBeenCalledWith({
                ...workOrderData,
                customer_id: 'customer-1',
                vehicle_id: 'vehicle-1',
                customer_type: 'registered',
                walk_in_vehicle_info: undefined
            })
        })

        test('should create work order with new customer and vehicle', async () => {
            // Arrange
            const workOrderData = {
                work_order_number: 'WO-0001',
                title: 'Oil Change',
                description: 'Regular maintenance',
                status: 'pending' as WorkOrderStatus,
                priority: 'medium' as const,
                shop_id: 'shop-1',
                customer_type: 'registered' as const,
                walk_in_vehicle_info: undefined,
                assigned_technician_id: undefined,
                appointment_id: undefined,
                invoice_id: undefined,
                started_at: undefined,
                completed_at: undefined,
                tags: [],
                attachments: [],
                notes: undefined
            }
            const customerData = { name: 'John Doe', email: 'john@example.com' }
            const vehicleData = { year: '2020', make: 'Toyota', model: 'Camry' }
            const mockCreatedCustomer = { id: 'customer-1', customer_name: 'John Doe' }
            const mockCreatedVehicle = { id: 'vehicle-1', year: 2020, make: 'Toyota', model: 'Camry' }
            const mockCreatedWorkOrder = { 
                id: '1', 
                created_at: '2024-01-29T10:00:00Z',
                updated_at: '2024-01-29T10:00:00Z',
                ...workOrderData, 
                customer_id: 'customer-1', 
                vehicle_id: 'vehicle-1',
                customer_type: 'registered' as const,
                walk_in_vehicle_info: undefined
            }

            // Mock customer creation
            const mockCustomerQuery = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCreatedCustomer, error: null })
            }
            const mockVehicleQuery = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCreatedVehicle, error: null })
            }

            mockFrom
                .mockReturnValueOnce({
                    insert: vi.fn().mockReturnValue(mockCustomerQuery)
                })
                .mockReturnValueOnce({
                    insert: vi.fn().mockReturnValue(mockVehicleQuery)
                })

            vi.spyOn(service, 'createWorkOrder').mockResolvedValue(mockCreatedWorkOrder)

            // Act
            const result = await service.createWorkOrderWithDependencies({
                workOrder: workOrderData,
                customer: customerData,
                vehicle: vehicleData
            })

            // Assert
            expect(result).toEqual(mockCreatedWorkOrder)
            expect(service.createWorkOrder).toHaveBeenCalledWith({
                ...workOrderData,
                customer_id: 'customer-1',
                vehicle_id: 'vehicle-1',
                customer_type: 'registered',
                walk_in_vehicle_info: undefined
            })
        })

        test('should throw error for missing customer name', async () => {
            // Arrange
            const workOrderData = {
                work_order_number: 'WO-0001',
                title: 'Oil Change',
                description: 'Regular maintenance',
                status: 'pending' as WorkOrderStatus,
                priority: 'medium' as const,
                shop_id: 'shop-1',
                customer_type: 'registered' as const,
                walk_in_vehicle_info: undefined,
                assigned_technician_id: undefined,
                appointment_id: undefined,
                invoice_id: undefined,
                started_at: undefined,
                completed_at: undefined,
                tags: [],
                attachments: [],
                notes: undefined
            }
            const customerData = { name: '', email: 'john@example.com' }
            const vehicleData = { year: '2020', make: 'Toyota', model: 'Camry' }

            // Act & Assert
            await expect(service.createWorkOrderWithDependencies({
                workOrder: workOrderData,
                customer: customerData,
                vehicle: vehicleData
            })).rejects.toThrow('Customer name is required')
        })

        test('should throw error for missing vehicle fields', async () => {
            // Arrange
            const workOrderData = {
                work_order_number: 'WO-0001',
                title: 'Oil Change',
                description: 'Regular maintenance',
                status: 'pending' as WorkOrderStatus,
                priority: 'medium' as const,
                shop_id: 'shop-1',
                customer_type: 'registered' as const,
                walk_in_vehicle_info: undefined,
                assigned_technician_id: undefined,
                appointment_id: undefined,
                invoice_id: undefined,
                started_at: undefined,
                completed_at: undefined,
                tags: [],
                attachments: [],
                notes: undefined
            }
            const customerData = { name: 'John Doe' }
            const vehicleData = { year: '', make: 'Toyota', model: 'Camry' }

            // Mock customer creation to succeed
            const mockCreatedCustomer = { id: 'customer-1', customer_name: 'John Doe' }
            const mockCustomerQuery = {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCreatedCustomer, error: null })
            }
            mockFrom.mockReturnValueOnce({
                insert: vi.fn().mockReturnValue(mockCustomerQuery)
            })

            // Act & Assert
            await expect(service.createWorkOrderWithDependencies({
                workOrder: workOrderData,
                customer: customerData,
                vehicle: vehicleData
            })).rejects.toThrow('Vehicle year, make, and model are required')
        })
    })

    describe('Error Handling and Edge Cases', () => {
        test('should handle null data responses gracefully', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: null, error: null })
            }
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            const result = await service.getWorkOrders('shop-1')

            // Assert
            expect(result).toEqual([])
        })

        test('should handle undefined error messages', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: null, error: {} })
            }
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue(mockQuery)
            })

            // Act & Assert
            await expect(service.getWorkOrders('shop-1')).rejects.toThrow('Failed to fetch work orders: undefined')
        })

        test('should handle work order number generation with invalid format', async () => {
            // Arrange
            const mockQuery = {
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ 
                    data: [{ work_order_number: 'INVALID-FORMAT' }], 
                    error: null 
                })
            }
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnValue(mockQuery)
            })

            // Act
            const result = await service.generateWorkOrderNumber('shop-1')

            // Assert
            expect(result).toBe('WO-0001')
        })
    })
})