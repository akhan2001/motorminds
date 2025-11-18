// src/app/(features)/operations/lib/work-order-archive-service.ts
import { createClient } from '@/utils/supabase/client'
import type { WorkOrder } from '../types/work-order'

export class WorkOrderArchiveService {
    private supabase = createClient()

    /**
     * Archive a work order (soft delete)
     * Sets archived = true, archived_at, and archived_by
     */
    async archiveWorkOrder(workOrderId: string, userId: string): Promise<void> {
        try {
            // First, get the work order to check if it has an appointment_id
            const { data: workOrder, error: fetchError } = await this.supabase
                .from('work_orders')
                .select('appointment_id, archived')
                .eq('id', workOrderId)
                .single()

            if (fetchError) {
                console.error('Error fetching work order before archiving:', fetchError)
                throw new Error(`Failed to fetch work order: ${fetchError.message}`)
            }

            if (workOrder?.archived) {
                throw new Error('Work order is already archived')
            }

            // Archive the work order (soft delete)
            const { error: archiveError } = await this.supabase
                .from('work_orders')
                .update({
                    archived: true,
                    archived_at: new Date().toISOString(),
                    archived_by: userId
                })
                .eq('id', workOrderId)

            if (archiveError) {
                console.error('Error archiving work order:', archiveError)
                throw new Error(`Failed to archive work order: ${archiveError.message}`)
            }

            // If the work order was linked to an appointment, reset the appointment status to 'scheduled'
            if (workOrder?.appointment_id) {
                const { error: updateError } = await this.supabase
                    .from('appointments')
                    .update({ status: 'scheduled' })
                    .eq('id', workOrder.appointment_id)

                if (updateError) {
                    console.error('Error updating appointment status after work order archiving:', updateError)
                    // Don't throw - archiving succeeded, this is just cleanup
                }
            }
        } catch (error) {
            console.error('Error in archiveWorkOrder:', error)
            throw error
        }
    }

    /**
     * Unarchive a work order (restore from archive)
     * Only admins should be able to do this
     */
    async unarchiveWorkOrder(workOrderId: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('work_orders')
                .update({
                    archived: false,
                    archived_at: null,
                    archived_by: null
                })
                .eq('id', workOrderId)

            if (error) {
                console.error('Error unarchiving work order:', error)
                throw new Error(`Failed to unarchive work order: ${error.message}`)
            }
        } catch (error) {
            console.error('Error in unarchiveWorkOrder:', error)
            throw error
        }
    }

    /**
     * Auto-archive work order when status changes to 'invoiced'
     */
    async autoArchiveIfInvoiced(workOrderId: string, newStatus: string, userId: string): Promise<void> {
        if (newStatus === 'invoiced') {
            try {
                await this.archiveWorkOrder(workOrderId, userId)
            } catch (error) {
                console.error('Error auto-archiving work order:', error)
                // Don't throw - status update should succeed even if archiving fails
            }
        }
    }

    /**
     * Get archived work orders for a shop
     */
    async getArchivedWorkOrders(shopId: string): Promise<WorkOrder[]> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(id, customer_name, customer_phone, customer_email),
                vehicle:customer_vehicles(id, year, make, model, license_plate, color),
                technician:employees(id, first_name, last_name),
                archived_by_user:users!work_orders_archived_by_fkey(id, email)
            `)
            .eq('shop_id', shopId)
            .eq('archived', true)
            .order('archived_at', { ascending: false })

        if (error) {
            console.error('Error fetching archived work orders:', error)
            throw new Error(`Failed to fetch archived work orders: ${error.message}`)
        }

        return data || []
    }

    /**
     * Check if a work order is archived
     */
    async isArchived(workOrderId: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select('archived')
            .eq('id', workOrderId)
            .single()

        if (error || !data) {
            return false
        }

        return data.archived === true
    }
}

// Export singleton instance
export const workOrderArchiveService = new WorkOrderArchiveService()

