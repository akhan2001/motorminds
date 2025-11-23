// src/app/(features)/operations/lib/work-order-permissions.ts
import { createClient } from '@/utils/supabase/client'

export type WorkOrderPermission = 'delete' | 'archive' | 'edit' | 'view'

export class WorkOrderPermissions {
    private supabase = createClient()

    /**
     * Check if user can delete/archive work orders
     * Only admins, super-admins, and shop owners can delete
     */
    async canDeleteWorkOrder(userId: string, shopId: string): Promise<boolean> {
        try {
            // Get user role
            const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('role, shop_id')
                .eq('id', userId)
                .single()

            if (userError || !userData) {
                console.error('Error fetching user data:', userError)
                return false
            }

            const userRole = userData.role?.toUpperCase()

            // Super admins can always delete
            if (userRole === 'SUPER-ADMIN') {
                return true
            }

            // Admins can delete within their shop
            if (userRole === 'ADMIN' && userData.shop_id === shopId) {
                return true
            }

            // Check if user is shop owner
            if (userRole === 'SHOP_OWNER' && userData.shop_id === shopId) {
                return true
            }

            // Alternative: Check if user's name matches shop owner name
            const { data: shopData } = await this.supabase
                .from('shops')
                .select('shop_owner')
                .eq('id', shopId)
                .single()

            const { data: { user } } = await this.supabase.auth.getUser()
            if (user && shopData?.shop_owner) {
                // Match user metadata or profile name with shop owner
                const userName = user.user_metadata?.full_name || user.email
                if (userName && userName.toLowerCase().includes(shopData.shop_owner.toLowerCase())) {
                    return true
                }
            }

            return false
        } catch (error) {
            console.error('Error checking delete permission:', error)
            return false
        }
    }

    /**
     * Check if user has any admin role
     */
    async isAdmin(userId: string): Promise<boolean> {
        try {
            const { data: userData, error } = await this.supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single()

            if (error || !userData) {
                return false
            }

            const userRole = userData.role?.toUpperCase()
            return userRole === 'ADMIN' || userRole === 'SUPER-ADMIN' || userRole === 'SHOP_OWNER'
        } catch (error) {
            console.error('Error checking admin status:', error)
            return false
        }
    }

    /**
     * Check if user can edit a work order
     * Most users can edit active work orders, but archived ones are read-only
     */
    async canEditWorkOrder(workOrderId: string, userId: string): Promise<{ canEdit: boolean; reason?: string }> {
        try {
            const { data: workOrder, error } = await this.supabase
                .from('work_orders')
                .select('archived, status, shop_id')
                .eq('id', workOrderId)
                .single()

            if (error || !workOrder) {
                return { canEdit: false, reason: 'Work order not found' }
            }

            // Archived work orders are read-only
            if (workOrder.archived) {
                return { canEdit: false, reason: 'Cannot edit archived work orders' }
            }

            // Invoiced work orders should not be edited (financial/legal reasons)
            if (workOrder.status === 'invoiced') {
                return { canEdit: false, reason: 'Cannot edit invoiced work orders' }
            }

            return { canEdit: true }
        } catch (error) {
            console.error('Error checking edit permission:', error)
            return { canEdit: false, reason: 'Error checking permissions' }
        }
    }
}

// Export singleton instance
export const workOrderPermissions = new WorkOrderPermissions()

