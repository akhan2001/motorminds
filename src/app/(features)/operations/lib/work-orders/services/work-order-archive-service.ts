// src/app/(features)/operations/lib/work-orders/services/work-order-archive-service.ts
import { createClient } from '@/utils/supabase/client'
import type { WorkOrder, WorkOrderWithDetails } from '../../../types/work-order'

export class WorkOrderArchiveService {
    private supabase = createClient()

    /**
     * Archive a work order (soft delete)
     * Sets archived = true, archived_at, and archived_by
     * Optionally archives the associated invoice if deleteInvoice is true
     */
    async archiveWorkOrder(workOrderId: string, userId: string, options?: { deleteInvoice?: boolean }): Promise<void> {
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

            // Archive the associated invoice ONLY if user opted to delete it
            if (options?.deleteInvoice) {
                console.log('User opted to delete invoice, looking for invoice with work_order_id:', workOrderId)
                
                // Use .maybeSingle() to handle case where no invoice exists (won't throw error)
                const { data: linkedInvoice, error: invoiceFetchError } = await this.supabase
                    .from('invoices_table')
                    .select('invoice_number, status, archived')
                    .eq('work_order_id', workOrderId)
                    .maybeSingle()

                console.log('Invoice fetch result:', { linkedInvoice, invoiceFetchError })

                if (invoiceFetchError) {
                    console.error('Error fetching invoice for archiving:', invoiceFetchError)
                } else if (linkedInvoice) {
                    if (!linkedInvoice.archived) {
                        console.log('Archiving invoice:', linkedInvoice.invoice_number)
                        const { error: invoiceArchiveError } = await this.supabase
                            .from('invoices_table')
                            .update({
                                archived: true,
                                status: 'cancelled',
                                notes: `Invoice archived - Work order archived on ${new Date().toLocaleDateString()}`
                            })
                            .eq('invoice_number', linkedInvoice.invoice_number)

                        if (invoiceArchiveError) {
                            console.error('Error archiving invoice when archiving work order:', invoiceArchiveError)
                            // Don't throw - work order archiving succeeded, invoice archive is secondary
                        } else {
                            console.log('Invoice archived successfully')
                        }
                    } else {
                        console.log('Invoice is already archived, skipping')
                    }
                } else {
                    console.log('No invoice found for this work order')
                }
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
    async getArchivedWorkOrders(shopId: string): Promise<WorkOrderWithDetails[]> {
        const { data, error } = await this.supabase
            .from('work_orders')
            .select(`
                *,
                customer:customers(id, customer_name, customer_phone, customer_email, customer_address),
                vehicle:customer_vehicles(id, year, make, model, license_plate, color, vin, mileage),
                technician:employees(id, first_name, last_name)
            `)
            .eq('shop_id', shopId)
            .eq('archived', true)
            .order('archived_at', { ascending: false })

        if (error) {
            console.error('Error fetching archived work orders:', error)
            throw new Error(`Failed to fetch archived work orders: ${error.message || JSON.stringify(error)}`)
        }

        // Fetch archived_by_user separately if archived_by is set
        const workOrdersWithUsers = await Promise.all(
            (data || []).map(async (workOrder) => {
                if (workOrder.archived_by) {
                    try {
                        const { data: userData } = await this.supabase
                            .from('users')
                            .select('id, email')
                            .eq('id', workOrder.archived_by)
                            .single()
                        
                        return {
                            ...workOrder,
                            archived_by_user: userData || undefined
                        }
                    } catch (err) {
                        // If user lookup fails, just return without archived_by_user
                        return workOrder
                    }
                }
                return workOrder
            })
        )

        return workOrdersWithUsers
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

