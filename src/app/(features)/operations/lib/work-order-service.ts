// Main service for work order CRUD operations
import { createClient } from '@/lib/supabase'
import type { WorkOrder, WorkOrderWithDetails, WorkOrderItem, WorkOrderStatus } from '../types/work-order'

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
        const { error } = await this.supabase
            .from('work_orders')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting work order:', error)
            throw new Error(`Failed to delete work order: ${error.message}`)
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