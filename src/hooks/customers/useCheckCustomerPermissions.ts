/**
 * Permission checking hook for customer operations
 * 
 * Following Supabase Studio's useAsyncCheckPermissions pattern.
 * Provides action-based permission checking for customer CRUD operations.
 */

import { useMemo } from 'react'
import { useCustomerAccessContext } from './useCustomerAccessContext'

export type CustomerAction = 'view' | 'edit' | 'delete' | 'create'

export interface CustomerPermissionCheck {
    /** Whether the user can perform the action */
    can: boolean
    /** Whether the permission check is still loading */
    isLoading: boolean
    /** Whether the permission check succeeded */
    isSuccess: boolean
    /** The user's access scope */
    accessScope: 'shop' | 'organization' | 'platform'
    /** The user's role */
    role: string
}

/**
 * Check if user can perform a specific action on customers
 * 
 * @param action - The action to check ('view' | 'edit' | 'delete' | 'create')
 * @param customer - Optional customer object for context-specific checks
 * @returns Permission check result with loading/success states
 * 
 * @example
 * const { can: canEdit, isLoading } = useCheckCustomerPermissions('edit')
 * const { can: canDelete } = useCheckCustomerPermissions('delete', customer)
 */
export function useCheckCustomerPermissions(
    action: CustomerAction,
    customer?: { shop_id?: string; isFromCurrentShop?: boolean }
): CustomerPermissionCheck {
    const { 
        accessContext, 
        isLoading, 
        isSuccess,
        accessScope 
    } = useCustomerAccessContext()

    const can = useMemo(() => {
        if (!isSuccess || !accessContext) return false

        switch (action) {
            case 'view':
                // Everyone can view within their scope
                return true

            case 'create':
                // Same as edit permissions
                return accessContext.canEdit

            case 'edit':
                // Check base edit permission
                if (!accessContext.canEdit) return false
                
                // For organization scope with a specific customer, 
                // check if it's from their shop
                if (customer && accessContext.accessScope === 'organization') {
                    const isOwnShop = customer.isFromCurrentShop ?? 
                        (customer.shop_id === accessContext.shopId)
                    return isOwnShop
                }
                
                // Platform can edit anything
                if (accessContext.accessScope === 'platform') return true
                
                return true

            case 'delete':
                // Check base delete permission
                if (!accessContext.canDelete) return false
                
                // For organization scope with a specific customer,
                // check if it's from their shop
                if (customer && accessContext.accessScope === 'organization') {
                    const isOwnShop = customer.isFromCurrentShop ?? 
                        (customer.shop_id === accessContext.shopId)
                    return isOwnShop
                }
                
                // Platform can delete anything
                if (accessContext.accessScope === 'platform') return true
                
                return true

            default:
                return false
        }
    }, [action, accessContext, isSuccess, customer])

    return {
        can,
        isLoading,
        isSuccess,
        accessScope: accessScope as 'shop' | 'organization' | 'platform',
        role: accessContext?.role ?? 'user',
    }
}

/**
 * Hook to get all customer permissions at once
 * 
 * @param customer - Optional customer for context-specific checks
 * @returns All permission checks
 */
export function useAllCustomerPermissions(
    customer?: { shop_id?: string; isFromCurrentShop?: boolean }
) {
    const { 
        accessContext, 
        isLoading, 
        isSuccess,
        accessScope,
        hasOrganizationAccess 
    } = useCustomerAccessContext()

    const permissions = useMemo(() => {
        if (!isSuccess || !accessContext) {
            return {
                canView: false,
                canCreate: false,
                canEdit: false,
                canDelete: false,
            }
        }

        // For edit/delete with a customer, check if from own shop
        let canEditThis = accessContext.canEdit
        let canDeleteThis = accessContext.canDelete

        if (customer && accessContext.accessScope === 'organization') {
            const isOwnShop = customer.isFromCurrentShop ?? 
                (customer.shop_id === accessContext.shopId)
            canEditThis = accessContext.canEdit && isOwnShop
            canDeleteThis = accessContext.canDelete && isOwnShop
        }

        // Platform can do everything
        if (accessContext.accessScope === 'platform') {
            canEditThis = accessContext.canEdit
            canDeleteThis = accessContext.canDelete
        }

        return {
            canView: true,
            canCreate: accessContext.canEdit,
            canEdit: canEditThis,
            canDelete: canDeleteThis,
        }
    }, [accessContext, isSuccess, customer])

    return {
        ...permissions,
        isLoading,
        isSuccess,
        accessScope,
        hasOrganizationAccess,
        role: accessContext?.role ?? 'user',
    }
}

export default useCheckCustomerPermissions
