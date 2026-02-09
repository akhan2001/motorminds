// Main service for work order CRUD operations
import { createClient } from '@/lib/supabase'
import type { WorkOrder, WorkOrderWithDetails, WorkOrderItem, WorkOrderStatus } from '../types/work-order'
import type { WalkInVehicleInfo } from '../../customers/types/vehicle'
import { workOrderArchiveService } from './work-order-archive-service'
import { workOrderPermissions } from './work-order-permissions'

export class WorkOrderService {
    private supabase = createClient()

    // READ operations
    async getWorkOrders(shopId: string, limit: number = 100, offset: number = 0): Promise<WorkOrder[]> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select('id, shop_id, customer_id, vehicle_id, appointment_id, assigned_technician_id, title, description, status, priority, created_at, updated_at, started_at, completed_at, archived')
            .eq('shop_id', shopId)
            .eq('archived', false) // Only non-archived work orders
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Error fetching work orders:', error)
            throw new Error(`Failed to fetch work orders: ${error.message}`)
        }

        return data || []
    }

    // GET work orders with customer and vehicle details for display
    // Fetches ALL active work orders (pending, approved, in_progress, waiting_parts, waiting_customer, ready)
    // and recent completed/invoiced work orders (last 90 days)
    async getWorkOrdersWithDetails(shopId: string, limit: number = 100, offset: number = 0): Promise<WorkOrderWithDetails[]> {
        const baseQuery = `
            id, shop_id, customer_id, vehicle_id, appointment_id, assigned_technician_id, title, description, status, priority, created_at, updated_at, started_at, completed_at, archived, customer_type, walk_in_vehicle_info, status_tracker,
            customer:customers(id, customer_name, customer_phone, customer_email),
            vehicle:customer_vehicles(id, year, make, model, license_plate, color),
            technician:employees(id, first_name, last_name)
        `

        // Active statuses that should always be shown (no limit)
        const activeStatuses = ['pending', 'approved', 'in_progress', 'waiting_parts', 'waiting_customer', 'ready']
        
        // Fetch ALL active work orders (no limit)
        const { data: activeWorkOrders, error: activeError } = await this.supabase
            .from('work_orders')
            .select(baseQuery)
            .eq('shop_id', shopId)
            .eq('archived', false)
            .in('status', activeStatuses)
            .order('created_at', { ascending: false })

        if (activeError) {
            console.error('Error fetching active work orders with details:', activeError)
            throw new Error(`Failed to fetch active work orders: ${activeError.message}`)
        }

        // Calculate date 90 days ago for recent completed/invoiced work orders
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const ninetyDaysAgoISO = ninetyDaysAgo.toISOString()

        // Fetch recent completed/invoiced work orders (last 90 days, with limit)
        const { data: completedWorkOrders, error: completedError } = await this.supabase
            .from('work_orders')
            .select(baseQuery)
            .eq('shop_id', shopId)
            .eq('archived', false)
            .in('status', ['completed', 'invoiced'])
            .gte('completed_at', ninetyDaysAgoISO) // Only recent completed ones
            .order('completed_at', { ascending: false })
            .limit(limit)

        if (completedError) {
            console.error('Error fetching completed work orders with details:', completedError)
            throw new Error(`Failed to fetch completed work orders: ${completedError.message}`)
        }

        // Combine and deduplicate by ID (in case a work order appears in both queries)
        const allWorkOrders = [...(activeWorkOrders || []), ...(completedWorkOrders || [])]
        const uniqueWorkOrders = Array.from(
            new Map(allWorkOrders.map(wo => [wo.id, wo])).values()
        )

        // Sort by created_at descending for consistent ordering
        return uniqueWorkOrders.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
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

        // Fetch archived_by_user separately if archived_by is set
        if (data?.archived_by) {
            try {
                const { data: userData } = await this.supabase
                    .from('users')
                    .select('id, email')
                    .eq('id', data.archived_by)
                    .single()
                
                return {
                    ...data,
                    archived_by_user: userData || undefined
                }
            } catch (err) {
                // If user lookup fails, just return without archived_by_user
                return data
            }
        }

        return data
    }

    async getWorkOrdersByStatus(shopId: string, status: WorkOrderStatus): Promise<WorkOrder[]> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select('*')
            .eq('shop_id', shopId)
            .eq('archived', false) // Only non-archived work orders
            .eq('status', status)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching work orders by status:', error)
            throw new Error(`Failed to fetch work orders: ${error.message}`)
        }

        return data || []
    }

    // GET active work orders (pending, in_progress, waiting_parts, waiting_customer) with details
    async getActiveWorkOrders(shopId: string, limit: number = 100, offset: number = 0): Promise<WorkOrderWithDetails[]> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select(`
                id, shop_id, customer_id, vehicle_id, appointment_id, assigned_technician_id, title, description, status, priority, created_at, updated_at, started_at, completed_at, archived, customer_type, walk_in_vehicle_info, status_tracker,
                customer:customers(id, customer_name, customer_phone, customer_email),
                vehicle:customer_vehicles(id, year, make, model, license_plate, color),
                technician:employees(id, first_name, last_name)
            `)
            .eq('shop_id', shopId)
            .eq('archived', false) // Only non-archived work orders
            .in('status', ['pending', 'approved', 'in_progress', 'waiting_parts', 'waiting_customer'])
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

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

    async updateWorkOrderStatus(id: string, status: WorkOrderStatus, enableAutomatedMessages: boolean = true): Promise<void> {
        // Get current work order to check if we're reverting from completed
        const currentWorkOrder = await this.getWorkOrderById(id)
        const isRevertingFromCompleted = currentWorkOrder?.status === 'completed' && status !== 'completed'

        // Prepare update data
        const updateData: any = {
            status,
            updated_at: new Date().toISOString()
        }

        // Handle status-specific timestamps
        if (status === 'in_progress') {
            // Only set started_at if it doesn't exist (preserve original start time)
            if (!currentWorkOrder?.started_at) {
                updateData.started_at = new Date().toISOString()
            }
        } else if (status === 'completed') {
            updateData.completed_at = new Date().toISOString()
        }

        // If reverting from completed, clear completed_at
        if (isRevertingFromCompleted) {
            updateData.completed_at = null

            // Cancel any pending automated messages for this work order
            await this.cancelPendingMessagesForWorkOrder(id)
        }

        const { error } = await this.supabase
            .from('work_orders')
            .update(updateData)
            .eq('id', id)

        if (error) {
            console.error('Error updating work order status:', error)
            throw new Error(`Failed to update work order status: ${error.message}`)
        }

        // Auto-archive if status is set to 'invoiced'
        if (status === 'invoiced') {
            const { data: { user } } = await this.supabase.auth.getUser()
            if (user) {
                await workOrderArchiveService.autoArchiveIfInvoiced(id, status, user.id)
            }
        }

        // After work order status set to 'completed', trigger automated messages
        // Only trigger if NOT reverting (i.e., this is a new completion) AND automated messages are enabled
        if (status === 'completed' && !isRevertingFromCompleted && enableAutomatedMessages) {
            try {
                // Get work order details for the trigger
                const workOrder = await this.getWorkOrderById(id)
                if (workOrder && workOrder.customer_id) {
                    // Extract service type from work order title
                    const extractServiceType = (title: string): string | null => {
                        if (!title) return null
                        const lowerTitle = title.toLowerCase()

                        if (lowerTitle.includes('oil change')) return 'oil_change'
                        if (lowerTitle.includes('brake')) return 'brake_service'
                        if (lowerTitle.includes('tire')) return 'tire_service'
                        if (lowerTitle.includes('inspection')) return 'inspection'
                        if (lowerTitle.includes('battery')) return 'battery_service'
                        if (lowerTitle.includes('alignment')) return 'alignment'
                        if (lowerTitle.includes('transmission')) return 'transmission_service'
                        if (lowerTitle.includes('engine')) return 'engine_service'
                        if (lowerTitle.includes('diagnostic')) return 'diagnostic'
                        if (lowerTitle.includes('ac') || lowerTitle.includes('air conditioning')) return 'ac_service'

                        return null
                    }

                    const serviceType = extractServiceType(workOrder.title)

                    // Trigger automated messaging (fire and forget - don't block completion)
                    fetch('/api/messaging/queue-automated', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            work_order_id: workOrder.id,
                            customer_id: workOrder.customer_id,
                            service_type: serviceType
                        })
                    }).catch((error) => {
                        // Silently handle fetch errors (network issues, etc.)
                        console.error('Failed to trigger automated messages:', error)
                    })
                }
            } catch (error) {
                // Don't fail the work order completion if messaging fails
                console.error('Failed to trigger automated messages:', error)
            }
        }
    }

    /**
     * Cancel all pending automated messages for a work order
     * @param workOrderId The work order ID
     */
    async cancelPendingMessagesForWorkOrder(workOrderId: string): Promise<void> {
        try {
            // Find all pending messages for this work order
            // Fetch all pending work_order_complete messages and filter in memory
            // (Supabase JS client doesn't directly support JSONB path queries in .eq())
            const { data: allPendingMessages, error: fetchError } = await this.supabase
                .from('ai_message_queue')
                .select('id, trigger_data')
                .eq('status', 'pending')
                .eq('trigger_event', 'work_order_complete')

            if (fetchError) {
                console.error('Error fetching pending messages:', fetchError)
                // Don't throw - this is a cleanup operation
                return
            }

            if (!allPendingMessages || allPendingMessages.length === 0) {
                return // No pending messages to cancel
            }

            // Filter messages that match this work order ID
            const pendingMessages = allPendingMessages.filter((msg: any) =>
                msg.trigger_data?.work_order_id === workOrderId
            )

            if (!pendingMessages || pendingMessages.length === 0) {
                return // No pending messages to cancel for this work order
            }

            // Delete all pending messages
            const messageIds = pendingMessages.map(msg => msg.id)
            const { error: deleteError } = await this.supabase
                .from('ai_message_queue')
                .delete()
                .in('id', messageIds)
                .eq('status', 'pending')

            if (deleteError) {
                console.error('Error cancelling pending messages:', deleteError)
                // Don't throw - this is a cleanup operation
            }
        } catch (error) {
            // Don't fail the revert if message cancellation fails
            console.error('Failed to cancel pending messages:', error)
        }
    }

    /**
     * Check if a work order can be reverted from completed status
     * @param workOrderId The work order ID to check
     * @returns Object with canRevert boolean and optional reason string
     */
    async canRevertFromCompleted(workOrderId: string): Promise<{ canRevert: boolean, reason?: string }> {
        const workOrder = await this.getWorkOrderById(workOrderId)

        if (!workOrder) {
            return { canRevert: false, reason: 'Work order not found' }
        }

        // Cannot revert if status is not completed
        if (workOrder.status !== 'completed') {
            return { canRevert: false, reason: 'Work order is not in completed status' }
        }

        // Warn if invoice_id exists (but allow revert)
        if (workOrder.invoice_id) {
            return {
                canRevert: true,
                reason: 'This work order has an invoice. Reverting may require invoice adjustments.'
            }
        }

        return { canRevert: true }
    }

    // DELETE operations
    /**
     * Archive (soft delete) a work order
     * Requires admin/shop owner permission
     * @param options.deleteInvoice - If true, also cancels the associated invoice
     */
    async deleteWorkOrder(id: string, options?: { deleteInvoice?: boolean }): Promise<void> {
        // Get current user ID
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) {
            throw new Error('User not authenticated')
        }

        // Get work order to check shop_id
        const { data: workOrder, error: fetchError } = await this.supabase
            .from('work_orders')
            .select('shop_id, archived')
            .eq('id', id)
            .single()

        if (fetchError || !workOrder) {
            throw new Error(`Failed to fetch work order: ${fetchError?.message || 'Not found'}`)
        }

        if (workOrder.archived) {
            throw new Error('Work order is already archived')
        }

        // Check permission
        const canDelete = await workOrderPermissions.canDeleteWorkOrder(user.id, workOrder.shop_id)
        if (!canDelete) {
            throw new Error('You do not have permission to delete work orders. Only admins and shop owners can delete work orders.')
        }

        // Archive the work order instead of deleting
        await workOrderArchiveService.archiveWorkOrder(id, user.id, options)
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