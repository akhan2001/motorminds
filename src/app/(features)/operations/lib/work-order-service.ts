// Main service for work order CRUD operations
import { createClient } from '@/lib/supabase'
import type { WorkOrder, WorkOrderWithDetails, WorkOrderItem, WorkOrderStatus } from '../types/work-order'
import type { WalkInVehicleInfo } from '../../customers/types/vehicle'

export class WorkOrderService {
    private supabase = createClient()

    // READ operations
    async getWorkOrders(shopId: string): Promise<WorkOrder[]> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching work orders:', error)
            throw new Error(`Failed to fetch work orders: ${error.message}`)
        }

        return data || []
    }

    // GET work orders with customer and vehicle details for display
    async getWorkOrdersWithDetails(shopId: string): Promise<WorkOrderWithDetails[]> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(id, customer_name, customer_phone, customer_email),
                vehicle:customer_vehicles(id, year, make, model, license_plate, color),
                technician:employees(id, first_name, last_name)
            `)
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching work orders with details:', error)
            throw new Error(`Failed to fetch work orders: ${error.message}`)
        }

        return data || []
    }

    async getWorkOrderById(id: string): Promise<WorkOrder | null> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching work order:', error)
            return null
        }

        return data
    }

    // GET single work order with customer and vehicle details
    async getWorkOrderWithDetailsById(id: string): Promise<WorkOrderWithDetails | null> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(id, customer_name, customer_phone, customer_email, customer_address),
                vehicle:customer_vehicles(id, year, make, model, license_plate, color, vin, mileage),
                technician:employees(id, first_name, last_name)
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching work order with details:', error)
            return null
        }

        return data
    }

    async getWorkOrdersByStatus(shopId: string, status: WorkOrderStatus): Promise<WorkOrder[]> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', status)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching work orders by status:', error)
            throw new Error(`Failed to fetch work orders: ${error.message}`)
        }

        return data || []
    }

    // GET active work orders (pending, in_progress, waiting_parts, waiting_customer) with details
    async getActiveWorkOrders(shopId: string): Promise<WorkOrderWithDetails[]> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(id, customer_name, customer_phone, customer_email),
                vehicle:customer_vehicles(id, year, make, model, license_plate, color),
                technician:employees(id, first_name, last_name)
            `)
            .eq('shop_id', shopId)
            .in('status', ['pending', 'approved', 'in_progress', 'waiting_parts', 'waiting_customer'])
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching active work orders:', error)
            throw new Error(`Failed to fetch active work orders: ${error.message}`)
        }

        return data || []
    }
    
    // CREATE operations  
    async createWorkOrder(data: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>): Promise<WorkOrder> {
        const { data: newWorkOrder, error } = await this.supabase
            .from('work_orders')
            .insert([data])
            .select()
            .single()

        if (error) {
            console.error('Error creating work order:', error)
            throw new Error(`Failed to create work order: ${error.message}`)
        }

        return newWorkOrder
    }

    async createWorkOrderItem(data: Omit<WorkOrderItem, 'id' | 'created_at'>): Promise<WorkOrderItem> {
        const { data: newItem, error } = await this.supabase
            .from('work_order_items')
            .insert([data])
            .select()
            .single()

        if (error) {
            console.error('Error creating work order item:', error)
            throw new Error(`Failed to create work order item: ${error.message}`)
        }

        return newItem
    }
    
    // UPDATE operations
    async updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
        const { data: updatedWorkOrder, error } = await this.supabase
            .from('work_orders')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating work order:', error)
            throw new Error(`Failed to update work order: ${error.message}`)
        }

        return updatedWorkOrder
    }

    async updateWorkOrderStatus(id: string, status: WorkOrderStatus): Promise<void> {
        const { error } = await this.supabase
            .from('work_orders')
            .update({ 
                status, 
                updated_at: new Date().toISOString(),
                ...(status === 'in_progress' && { started_at: new Date().toISOString() }),
                ...(status === 'completed' && { completed_at: new Date().toISOString() })
            })
            .eq('id', id)

        if (error) {
            console.error('Error updating work order status:', error)
            throw new Error(`Failed to update work order status: ${error.message}`)
        }
    }
    
    // DELETE operations
    async deleteWorkOrder(id: string): Promise<void> {
        // First, get the work order to check if it has an appointment_id
        const { data: workOrder, error: fetchError } = await this.supabase
            .from('work_orders')
            .select('appointment_id')
            .eq('id', id)
            .single()

        if (fetchError) {
            console.error('Error fetching work order before deletion:', fetchError)
            throw new Error(`Failed to fetch work order: ${fetchError.message}`)
        }

        // Delete the work order
        const { error: deleteError } = await this.supabase
            .from('work_orders')
            .delete()
            .eq('id', id)

        if (deleteError) {
            console.error('Error deleting work order:', deleteError)
            throw new Error(`Failed to delete work order: ${deleteError.message}`)
        }

        // If the work order was linked to an appointment, reset the appointment status to 'scheduled'
        if (workOrder?.appointment_id) {
            const { error: updateError } = await this.supabase
                .from('appointments')
                .update({ status: 'scheduled' })
                .eq('id', workOrder.appointment_id)

            if (updateError) {
                console.error('Error updating appointment status after work order deletion:', updateError)
                // Don't throw - work order deletion succeeded, this is just cleanup
            }
        }
    }

    async deleteWorkOrderItem(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('work_order_items')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting work order item:', error)
            throw new Error(`Failed to delete work order item: ${error.message}`)
        }
    }

    async searchWorkOrders(shopId: string, query: string): Promise<WorkOrder[]> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select('*')
            .eq('shop_id', shopId)
            .or(`title.ilike.%${query}%,description.ilike.%${query}%,work_order_number.ilike.%${query}%`)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error searching work orders:', error)
            throw new Error(`Failed to search work orders: ${error.message}`)
        }

        return data || []
    }

    // CREATE work order for walk-in customers (no customer record, optional vehicle record)
    async createWalkInWorkOrder(data: {
        workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at' | 'customer_id' | 'customer_type' | 'walk_in_vehicle_info'>
        walkInVehicleInfo: WalkInVehicleInfo
    }): Promise<WorkOrder> {
        console.log('Creating walk-in work order with vehicle info:', data.walkInVehicleInfo)
        console.log('Walk-in work order vehicle_id:', data.workOrder.vehicle_id)
        
        // Validate required walk-in vehicle fields
        if (!data.walkInVehicleInfo.year || !data.walkInVehicleInfo.make || !data.walkInVehicleInfo.model || !data.walkInVehicleInfo.license_plate) {
            throw new Error('Year, make, model, and license plate are required for walk-in customers')
        }

        const workOrderData: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'> = {
            ...data.workOrder,
            customer_id: null, // explicit null for walk-in
            // preserve vehicle_id if provided; else explicit null
            vehicle_id: data.workOrder.vehicle_id || null,
            customer_type: 'walk_in',
            walk_in_vehicle_info: data.walkInVehicleInfo,
        }

        console.log('Creating work order with walk-in data:', workOrderData)
        return this.createWorkOrder(workOrderData)
    }

    // CREATE work order with customer and vehicle creation if needed
    async createWorkOrderWithDependencies(data: {
        workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at' | 'customer_id' | 'vehicle_id'>
        customer: {
            id?: string
            name: string
            email?: string
            phone?: string
            address?: string
        }
        vehicle: {
            id?: string
            year: string
            make: string
            model: string
            color?: string
            vin?: string
            license_plate?: string
            mileage?: string
        }
    }): Promise<WorkOrder> {
        let customerId = data.customer.id
        let vehicleId = data.vehicle.id

        // 1. Create customer if needed
        if (!customerId || customerId === 'new') {
            console.log('Creating new customer:', data.customer.name)
            
            // Validate required customer fields
            if (!data.customer.name?.trim()) {
                throw new Error('Customer name is required')
            }
            
            const { data: newCustomer, error: customerError } = await this.supabase
                .from('customers')
                .insert([{
                    shop_id: data.workOrder.shop_id,
                    customer_name: data.customer.name,
                    customer_email: data.customer.email || null,
                    customer_phone: data.customer.phone || '',
                    customer_address: data.customer.address || null,
                }])
                .select()
                .single()

            if (customerError) {
                console.error('Error creating customer:', customerError)
                throw new Error(`Failed to create customer: ${customerError.message}`)
            }

            customerId = newCustomer.id
            console.log('Customer created successfully with ID:', customerId)
        }

        // 2. Create vehicle if needed
        if (!vehicleId || vehicleId === 'new') {
            console.log('Creating new vehicle for customer:', customerId)
            
            // Validate required vehicle fields
            if (!data.vehicle.year || !data.vehicle.make?.trim() || !data.vehicle.model?.trim()) {
                throw new Error('Vehicle year, make, and model are required')
            }
            
            const { data: newVehicle, error: vehicleError } = await this.supabase
                .from('customer_vehicles')
                .insert([{
                    customer_id: customerId,
                    year: parseInt(data.vehicle.year) || new Date().getFullYear(),
                    make: data.vehicle.make?.trim() || 'Unknown',
                    model: data.vehicle.model?.trim() || 'Unknown',
                    color: data.vehicle.color?.trim() || null,
                    vin: data.vehicle.vin?.trim() || null,
                    license_plate: data.vehicle.license_plate?.trim() || null,
                    mileage: data.vehicle.mileage ? parseInt(data.vehicle.mileage) : null,
                }])
                .select()
                .single()

            if (vehicleError) {
                console.error('Error creating vehicle:', vehicleError)
                throw new Error(`Failed to create vehicle: ${vehicleError.message}`)
            }

            vehicleId = newVehicle.id
            console.log('Vehicle created successfully with ID:', vehicleId)
        }

        // 3. Create work order with valid customer_id and vehicle_id
        if (!customerId || !vehicleId) {
            throw new Error('Failed to create customer or vehicle - missing IDs')
        }

        const workOrderData: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'> = {
            ...data.workOrder,
            customer_id: customerId,
            vehicle_id: vehicleId,
            customer_type: 'registered',
            walk_in_vehicle_info: undefined,
        }

        console.log('Creating work order with customer_id:', customerId, 'vehicle_id:', vehicleId)
        return this.createWorkOrder(workOrderData)
    }

    // Utility method to generate work order number
    async generateWorkOrderNumber(shopId: string): Promise<string> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select('work_order_number')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })
            .limit(1)

        if (error) {
            console.error('Error generating work order number:', error)
        }

        const lastNumber = data?.[0]?.work_order_number
        if (lastNumber) {
            const match = lastNumber.match(/WO-(\d+)/)
            if (match) {
                const nextNumber = parseInt(match[1]) + 1
                return `WO-${nextNumber.toString().padStart(4, '0')}`
            }
        }

        return 'WO-0001'
    }
}

// Create singleton instance
export const workOrderService = new WorkOrderService()