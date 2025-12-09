// Organization-aware customer service utilities
import { createClient } from '@/utils/supabase/client'
import type { Customer } from '@/app/(features)/customers/types'

const supabase = createClient()

export class OrganizationCustomerService {
    
    /**
     * Check if a customer is accessible to a user (organization-aware)
     */
    static async isCustomerAccessible(customerId: string, userShopId: string): Promise<boolean> {
        try {
            // Get user's shop organization info
            const { data: shopData } = await supabase
                .from('shops')
                .select('organization_id')
                .eq('id', userShopId)
                .single()

            let customerQuery = supabase
                .from('customers')
                .select('id, shop_id, organization_id')
                .eq('id', customerId)

            // Apply organization-aware filter
            if (shopData?.organization_id) {
                // MSO shop: allow customers from same organization or same shop
                customerQuery = customerQuery.or(`organization_id.eq.${shopData.organization_id},shop_id.eq.${userShopId}`)
            } else {
                // Non-MSO shop: only same shop
                customerQuery = customerQuery.eq('shop_id', userShopId)
            }

            const { data, error } = await customerQuery.maybeSingle()
            return !error && !!data
        } catch (error) {
            console.error('Error checking customer accessibility:', error)
            return false
        }
    }

    /**
     * Get accessible customers for a user (organization-aware)
     */
    static async getAccessibleCustomers(
        userShopId: string, 
        options?: {
            search?: string
            limit?: number
            includeShopInfo?: boolean
        }
    ): Promise<Customer[]> {
        try {
            // Get user's shop organization info
            const { data: shopData } = await supabase
                .from('shops')
                .select('organization_id')
                .eq('id', userShopId)
                .single()

            let query = supabase
                .from('customers')
                .select(options?.includeShopInfo ? `
                    *,
                    shops:shop_id (
                        shop_name
                    )
                ` : '*')
                .order('customer_name', { ascending: true })

            if (options?.limit) {
                query = query.limit(options.limit)
            }

            // Apply organization-aware filter
            if (shopData?.organization_id) {
                // MSO shop: include customers from same organization
                query = query.or(`organization_id.eq.${shopData.organization_id},shop_id.eq.${userShopId}`)
            } else {
                // Non-MSO shop: only same shop
                query = query.eq('shop_id', userShopId)
            }

            // Apply search filter if provided
            if (options?.search && options.search.length >= 2) {
                const searchTerm = options.search.trim()
                if (searchTerm.match(/^\+?[\d\s()-]+$/)) {
                    // Phone search
                    const cleanPhone = searchTerm.replace(/\D/g, '')
                    query = query.ilike('customer_phone', `%${cleanPhone}%`)
                } else if (searchTerm.includes('@')) {
                    // Email search
                    query = query.ilike('customer_email', `%${searchTerm}%`)
                } else {
                    // Name/general search
                    query = query.or(`customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%`)
                }
            }

            const { data, error } = await query

            if (error) {
                console.error('Error fetching accessible customers:', error)
                return []
            }

            // Add organization context to results
            return (data || []).map(customer => ({
                ...customer,
                isFromCurrentShop: customer.shop_id === userShopId,
                shopName: options?.includeShopInfo ? (customer as any).shops?.shop_name : undefined
            }))

        } catch (error) {
            console.error('Error in getAccessibleCustomers:', error)
            return []
        }
    }

    /**
     * Get organization status for a shop
     */
    static async getOrganizationStatus(shopId: string): Promise<{
        isMSO: boolean
        organizationId: string | null
        canAccessOrganizationCustomers: boolean
    }> {
        try {
            const { data: shopData } = await supabase
                .from('shops')
                .select('organization_id')
                .eq('id', shopId)
                .single()

            const organizationId = shopData?.organization_id || null
            const isMSO = !!organizationId

            return {
                isMSO,
                organizationId,
                canAccessOrganizationCustomers: isMSO
            }
        } catch (error) {
            console.error('Error getting organization status:', error)
            return {
                isMSO: false,
                organizationId: null,
                canAccessOrganizationCustomers: false
            }
        }
    }

    /**
     * Validate customer assignment to organization/shop
     */
    static async validateCustomerAssignment(
        customerId: string,
        targetShopId: string,
        userShopId: string
    ): Promise<{ isValid: boolean; reason?: string }> {
        try {
            // Get user's shop organization info
            const { data: userShopData } = await supabase
                .from('shops')
                .select('organization_id')
                .eq('id', userShopId)
                .single()

            // Get target shop organization info
            const { data: targetShopData } = await supabase
                .from('shops')
                .select('organization_id')
                .eq('id', targetShopId)
                .single()

            // Get customer info
            const { data: customerData } = await supabase
                .from('customers')
                .select('id, shop_id, organization_id')
                .eq('id', customerId)
                .single()

            if (!customerData) {
                return { isValid: false, reason: 'Customer not found' }
            }

            // Check if user can access this customer
            const canAccess = await this.isCustomerAccessible(customerId, userShopId)
            if (!canAccess) {
                return { isValid: false, reason: 'Customer not accessible to user' }
            }

            // Check if target shop is in same organization (for MSO)
            if (userShopData?.organization_id && targetShopData?.organization_id) {
                if (userShopData.organization_id === targetShopData.organization_id) {
                    return { isValid: true }
                } else {
                    return { isValid: false, reason: 'Target shop not in same organization' }
                }
            }

            // For non-MSO, only allow assignment to same shop
            if (targetShopId === userShopId) {
                return { isValid: true }
            }

            return { isValid: false, reason: 'Invalid shop assignment for non-MSO' }

        } catch (error) {
            console.error('Error validating customer assignment:', error)
            return { isValid: false, reason: 'Validation error' }
        }
    }
}
