import { WorkOrderService } from '@/app/(features)/operations/lib/work-order-service'

export interface CustomerIntakeState {
    customerId: string
    customerName: string
    customerEmail: string
    customerPhone: string
    customerAddress: string
    vehicleId: string
    vehicleYear: string
    vehicleMake: string
    vehicleModel: string
    vehicleColor: string
    vehicleVin: string
    vehicleLicensePlate: string
    vehicleMileage: string
}

export interface WorkOrderData {
    serviceDescription: string
    customerState: CustomerIntakeState
}

export const validateForm = (
    serviceDescription: string,
    customerId: string,
    vehicleId: string
): string | null => {
    if (!serviceDescription.trim()) {
        return 'Please describe the service needed'
    }

    if (!customerId || customerId === '' || customerId === 'new') {
        return 'Please select or save a customer first'
    }

    if (!vehicleId || vehicleId === '' || vehicleId === 'new') {
        return 'Please select or save a vehicle first'
    }

    return null
}

export const createWorkOrder = async (
    shopId: string,
    data: WorkOrderData
): Promise<{ success: boolean; workOrderNumber?: string; error?: string }> => {
    try {
        // Validate shopId
        if (!shopId || shopId === '') {
            return {
                success: false,
                error: 'Shop ID is required. Please refresh the page.'
            }
        }

        // Validate customer and vehicle IDs
        if (!data.customerState.customerId || data.customerState.customerId === '' || data.customerState.customerId === 'new') {
            return {
                success: false,
                error: 'Please save the customer information first'
            }
        }

        if (!data.customerState.vehicleId || data.customerState.vehicleId === '' || data.customerState.vehicleId === 'new') {
            return {
                success: false,
                error: 'Please save the vehicle information first'
            }
        }

        const workOrderService = new WorkOrderService()
        const workOrderNumber = await workOrderService.generateWorkOrderNumber(shopId)

        // Create registered customer work order
        const workOrder = await workOrderService.createWorkOrder({
            shop_id: shopId,
            work_order_number: workOrderNumber,
            customer_id: data.customerState.customerId,
            vehicle_id: data.customerState.vehicleId,
            title: 'Customer Intake',
            description: data.serviceDescription,
            status: 'pending',
            priority: 'medium',
            customer_type: 'registered',
            walk_in_vehicle_info: undefined,
            assigned_technician_id: null,
            appointment_id: null,
            tags: [],
            attachments: [],
            notes: `Created from customer intake form. Customer: ${data.customerState.customerName}. Vehicle: ${data.customerState.vehicleYear} ${data.customerState.vehicleMake} ${data.customerState.vehicleModel}`,
        })

        return { success: true, workOrderNumber: workOrder.work_order_number }
    } catch (error: any) {
        console.error('Error creating work order:', error)
        return {
            success: false,
            error: error.message || 'Failed to create work order'
        }
    }
}

export const getInitialCustomerState = (): CustomerIntakeState => ({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    vehicleId: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    vehicleVin: '',
    vehicleLicensePlate: '',
    vehicleMileage: '',
})

