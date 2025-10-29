import { describe, test, expect, vi, beforeEach } from 'vitest'
import { WorkOrderService } from './work-order-service'
import { mockWalkInVehicleInfo, mockWorkOrderData } from '@/data/test-fixtures/walk-in-data'

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
    createClient: () => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn()
                }))
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn()
                }))
            }))
        }))
    })
}))

describe('WorkOrderService - Walk-in Customers', () => {
    let service: WorkOrderService

    beforeEach(() => {
        service = new WorkOrderService()
        vi.clearAllMocks()
    })

    test('should create walk-in work order successfully', async () => {
        // Arrange
        const mockWorkOrder = {
            id: 'test-id',
            created_at: '2024-01-29T10:00:00Z',
            updated_at: '2024-01-29T10:00:00Z',
            ...mockWorkOrderData,
            customer_type: 'walk_in' as const,
            walk_in_vehicle_info: mockWalkInVehicleInfo,
            customer_id: undefined,
            vehicle_id: undefined
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
        expect(result.customer_id).toBeUndefined()
        expect(result.vehicle_id).toBeUndefined()
        expect(service.createWorkOrder).toHaveBeenCalledWith({
            ...mockWorkOrderData,
            customer_type: 'walk_in',
            walk_in_vehicle_info: mockWalkInVehicleInfo,
            customer_id: undefined,
            vehicle_id: undefined
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
            customer_id: undefined,
            vehicle_id: undefined
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
            customer_id: undefined,
            vehicle_id: undefined
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