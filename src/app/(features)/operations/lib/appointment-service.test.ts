import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { AppointmentService } from './appointment-service'
import { mockWalkInVehicleInfo } from '@/data/test-fixtures/walk-in-data'
import type { Appointment, AppointmentCreateData } from '../types/appointment'
import type { WalkInVehicleInfo } from '../../customers/types/vehicle'

// Mock the Supabase client (hoisted so it's available inside vi.mock factory)
const mockSupabaseClient = vi.hoisted(() => ({
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                single: vi.fn(),
                order: vi.fn(() => ({
                    gte: vi.fn(() => ({
                        lte: vi.fn(() => ({
                            order: vi.fn()
                        }))
                    })),
                    order: vi.fn()
                }))
            })),
            order: vi.fn(() => ({
                order: vi.fn()
            }))
        })),
        insert: vi.fn(() => ({
            select: vi.fn(() => ({
                single: vi.fn()
            }))
        })),
        update: vi.fn(() => ({
            eq: vi.fn()
        })),
        delete: vi.fn(() => ({
            eq: vi.fn()
        }))
    }))
}))

vi.mock('@/utils/supabase/client', () => ({
    createClient: () => mockSupabaseClient
}))

// Mock WorkOrderService
const mockWorkOrderService = vi.hoisted(() => ({
    createWalkInWorkOrder: vi.fn()
}))

vi.mock('./work-order-service', () => ({
    WorkOrderService: vi.fn(() => mockWorkOrderService)
}))

describe('AppointmentService', () => {
    let mockFrom: any
    let mockSelect: any
    let mockInsert: any
    let mockUpdate: any

    beforeEach(() => {
        mockFrom = mockSupabaseClient.from
        mockSelect = {
            eq: vi.fn(() => ({
                single: vi.fn(),
                order: vi.fn(() => ({
                    gte: vi.fn(() => ({
                        lte: vi.fn(() => ({
                            order: vi.fn()
                        }))
                    })),
                    order: vi.fn()
                }))
            })),
            order: vi.fn(() => ({
                order: vi.fn()
            }))
        }
        mockInsert = {
            select: vi.fn(() => ({
                single: vi.fn()
            }))
        }
        mockUpdate = {
            eq: vi.fn()
        }
        mockFrom.mockReturnValue({
            select: () => mockSelect,
            insert: () => mockInsert,
            update: () => mockUpdate,
            delete: vi.fn(() => ({ eq: vi.fn() }))
        })
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('createWalkInAppointment', () => {
        const mockAppointmentData: Omit<AppointmentCreateData, 'customer_id' | 'vehicle_id' | 'customer_type' | 'walk_in_vehicle_info'> = {
            shop_id: 'test-shop-id',
            appointment_date: '2024-01-30',
            start_time: '10:00',
            end_time: '11:00',
            service_type: 'Oil Change',
            notes: 'Test appointment',
            status: 'scheduled',
            created_by_customer: false
        }

        test('should create walk-in appointment successfully', async () => {
            // Arrange
            const mockAppointment: Appointment = {
                id: 'test-appointment-id',
                created_at: '2024-01-30T10:00:00Z',
                updated_at: '2024-01-30T10:00:00Z',
                shop_id: 'test-shop-id',
                customer_id: null,
                vehicle_id: null,
                appointment_date: '2024-01-30',
                start_time: '10:00',
                end_time: '11:00',
                service_type: 'Oil Change',
                notes: 'Test appointment',
                status: 'scheduled',
                confirmation_code: 'ABC123',
                created_by_customer: false,
                customer_type: 'walk_in',
                walk_in_vehicle_info: mockWalkInVehicleInfo
            }

            mockInsert.select().single.mockResolvedValue({
                data: mockAppointment,
                error: null
            })

            // Act
            const result = await AppointmentService.createWalkInAppointment({
                appointment: mockAppointmentData,
                walkInVehicleInfo: mockWalkInVehicleInfo
            })

            // Assert
            expect(result.customer_type).toBe('walk_in')
            expect(result.walk_in_vehicle_info).toEqual(mockWalkInVehicleInfo)
            expect(result.customer_id).toBeNull()
            expect(result.vehicle_id).toBeNull()
            expect(mockInsert.select().single).toHaveBeenCalled()
        })

        test('should create walk-in appointment with vehicle_id when vehicle is selected', async () => {
            // Arrange
            const mockAppointment: Appointment = {
                id: 'test-appointment-id',
                created_at: '2024-01-30T10:00:00Z',
                updated_at: '2024-01-30T10:00:00Z',
                shop_id: 'test-shop-id',
                customer_id: null,
                vehicle_id: 'test-vehicle-id',
                appointment_date: '2024-01-30',
                start_time: '10:00',
                end_time: '11:00',
                service_type: 'Oil Change',
                status: 'scheduled',
                confirmation_code: 'ABC123',
                created_by_customer: false,
                customer_type: 'walk_in',
                walk_in_vehicle_info: mockWalkInVehicleInfo
            }

            mockInsert.select().single.mockResolvedValue({
                data: mockAppointment,
                error: null
            })

            // Act
            const result = await AppointmentService.createWalkInAppointment({
                appointment: mockAppointmentData,
                walkInVehicleInfo: mockWalkInVehicleInfo,
                vehicleId: 'test-vehicle-id'
            })

            // Assert
            expect(result.vehicle_id).toBe('test-vehicle-id')
            expect(result.customer_id).toBeNull()
        })

        test('should throw error for missing year', async () => {
            // Arrange
            const invalidVehicleInfo: WalkInVehicleInfo = {
                ...mockWalkInVehicleInfo,
                year: undefined as any
            }

            // Act & Assert
            await expect(AppointmentService.createWalkInAppointment({
                appointment: mockAppointmentData,
                walkInVehicleInfo: invalidVehicleInfo
            })).rejects.toThrow('Year, make, model, and license plate are required for walk-in customers')
        })

        test('should throw error for missing make', async () => {
            // Arrange
            const invalidVehicleInfo: WalkInVehicleInfo = {
                ...mockWalkInVehicleInfo,
                make: ''
            }

            // Act & Assert
            await expect(AppointmentService.createWalkInAppointment({
                appointment: mockAppointmentData,
                walkInVehicleInfo: invalidVehicleInfo
            })).rejects.toThrow('Year, make, model, and license plate are required for walk-in customers')
        })

        test('should throw error for missing model', async () => {
            // Arrange
            const invalidVehicleInfo: WalkInVehicleInfo = {
                ...mockWalkInVehicleInfo,
                model: ''
            }

            // Act & Assert
            await expect(AppointmentService.createWalkInAppointment({
                appointment: mockAppointmentData,
                walkInVehicleInfo: invalidVehicleInfo
            })).rejects.toThrow('Year, make, model, and license plate are required for walk-in customers')
        })

        test('should throw error for missing license plate', async () => {
            // Arrange
            const invalidVehicleInfo: WalkInVehicleInfo = {
                ...mockWalkInVehicleInfo,
                license_plate: ''
            }

            // Act & Assert
            await expect(AppointmentService.createWalkInAppointment({
                appointment: mockAppointmentData,
                walkInVehicleInfo: invalidVehicleInfo
            })).rejects.toThrow('Year, make, model, and license plate are required for walk-in customers')
        })
    })

    describe('createWorkOrderFromAppointmentV2', () => {
        test('should create work order from walk-in appointment', async () => {
            // Arrange
            const appointmentId = 'test-appointment-id'
            const mockWalkInAppointment = {
                id: appointmentId,
                shop_id: 'test-shop-id',
                customer_id: null,
                vehicle_id: 'test-vehicle-id',
                appointment_date: '2024-01-30',
                service_type: 'Oil Change',
                notes: 'Test notes',
                customer_type: 'walk_in',
                walk_in_vehicle_info: mockWalkInVehicleInfo,
                customer: null,
                vehicle: null
            }

            const mockWorkOrder = {
                id: 'test-work-order-id',
                work_order_number: 'WO-20240130-1234'
            }

            mockSelect.eq().single.mockResolvedValue({
                data: mockWalkInAppointment,
                error: null
            })

            mockWorkOrderService.createWalkInWorkOrder.mockResolvedValue(mockWorkOrder)
            mockUpdate.eq.mockResolvedValue({ error: null })

            // Act
            const result = await AppointmentService.createWorkOrderFromAppointmentV2(appointmentId)

            // Assert
            expect(result).toBe('test-work-order-id')
            expect(mockWorkOrderService.createWalkInWorkOrder).toHaveBeenCalledWith({
                workOrder: expect.objectContaining({
                    shop_id: 'test-shop-id',
                    vehicle_id: 'test-vehicle-id',
                    appointment_id: appointmentId,
                    title: expect.stringContaining('Oil Change'),
                    status: 'pending',
                    priority: 'medium'
                }),
                walkInVehicleInfo: mockWalkInVehicleInfo
            })
            expect(mockUpdate.eq).toHaveBeenCalledWith('id', appointmentId)
        })

        test('should create work order from registered appointment', async () => {
            // Arrange
            const appointmentId = 'test-appointment-id'
            const mockRegisteredAppointment = {
                id: appointmentId,
                shop_id: 'test-shop-id',
                customer_id: 'test-customer-id',
                vehicle_id: 'test-vehicle-id',
                appointment_date: '2024-01-30',
                service_type: 'Oil Change',
                notes: 'Test notes',
                customer_type: 'registered',
                walk_in_vehicle_info: null,
                customer: {
                    customer_name: 'John Doe'
                },
                vehicle: null
            }

            const mockWorkOrder = {
                id: 'test-work-order-id'
            }

            mockSelect.eq().single.mockResolvedValue({
                data: mockRegisteredAppointment,
                error: null
            })

            mockInsert.select().single.mockResolvedValue({
                data: mockWorkOrder,
                error: null
            })

            mockUpdate.eq.mockResolvedValue({ error: null })

            // Act
            const result = await AppointmentService.createWorkOrderFromAppointmentV2(appointmentId)

            // Assert
            expect(result).toBe('test-work-order-id')
            expect(mockInsert.select().single).toHaveBeenCalled()
            const insertCall = mockFrom().insert.mock.calls[0][0][0]
            expect(insertCall.customer_id).toBe('test-customer-id')
            expect(insertCall.vehicle_id).toBe('test-vehicle-id')
            expect(insertCall.customer_type).toBe('registered')
            expect(insertCall.walk_in_vehicle_info).toBeNull()
            expect(insertCall.title).toContain('John Doe')
        })

        test('should throw error if appointment not found', async () => {
            // Arrange
            mockSelect.eq().single.mockResolvedValue({
                data: null,
                error: { message: 'Not found' }
            })

            // Act & Assert
            await expect(
                AppointmentService.createWorkOrderFromAppointmentV2('non-existent-id')
            ).rejects.toThrow('Appointment not found')
        })

        test('should handle walk-in appointment without vehicle_id', async () => {
            // Arrange
            const appointmentId = 'test-appointment-id'
            const mockWalkInAppointment = {
                id: appointmentId,
                shop_id: 'test-shop-id',
                customer_id: null,
                vehicle_id: null,
                appointment_date: '2024-01-30',
                service_type: 'Oil Change',
                notes: 'Test notes',
                customer_type: 'walk_in',
                walk_in_vehicle_info: mockWalkInVehicleInfo,
                customer: null,
                vehicle: null
            }

            const mockWorkOrder = {
                id: 'test-work-order-id'
            }

            mockSelect.eq().single.mockResolvedValue({
                data: mockWalkInAppointment,
                error: null
            })

            mockWorkOrderService.createWalkInWorkOrder.mockResolvedValue(mockWorkOrder)
            mockUpdate.eq.mockResolvedValue({ error: null })

            // Act
            const result = await AppointmentService.createWorkOrderFromAppointmentV2(appointmentId)

            // Assert
            expect(result).toBe('test-work-order-id')
            expect(mockWorkOrderService.createWalkInWorkOrder).toHaveBeenCalledWith({
                workOrder: expect.objectContaining({
                    vehicle_id: undefined
                }),
                walkInVehicleInfo: mockWalkInVehicleInfo
            })
        })
    })
})

