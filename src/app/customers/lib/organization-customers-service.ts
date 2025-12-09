// Organization-aware customers service for the main customers page
import { createClient } from '@/utils/supabase/client'
import { shouldEnableOrganizationWideSearch, isOrganizationAdmin } from '@/lib/utils/organization-utils'

const supabase = createClient()

export interface OrganizationCustomer {
    id: string
    customer_name: string
    customer_email: string | null
    customer_phone: string
    customer_address: string | null
    customer_vehicle: any
    license_plate: string | null
    tags: string[]
    shop_id: string
    organization_id: string | null
    created_at: string
    updated_at: string | null
    notes: string | null
    customer_source: string | null
    // Organization context
    isFromCurrentShop?: boolean
    shopName?: string
    shops?: {
        id: string
        shop_name: string
    }
}

export class OrganizationCustomersService {
    
    /**
     * Get organization status for current user
     */
    static async getOrganizationStatus(userId: string): Promise<{
        shopId: string | null
        organizationId: string | null
        adminType: string | null
        canAccessOrganizationCustomers: boolean
    }> {
        try {
            const { data: userData } = await supabase
                .from('users')
                .select(`
                    shop_id,
                    organization_id,
                    role,
                    shops:shop_id (
                        organization_id
                    )
                `)
                .eq('id', userId)
                .single()

            if (!userData) {
                return {
                    shopId: null,
                    organizationId: null,
                    adminType: null,
                    canAccessOrganizationCustomers: false
                }
            }

            const shopId = userData.shop_id
            const organizationId = userData.organization_id || userData.shops?.organization_id || null
            const adminType = userData.role
            const canAccessOrganizationCustomers = shouldEnableOrganizationWideSearch(adminType, organizationId)

            return {
                shopId,
                organizationId,
                adminType,
                canAccessOrganizationCustomers
            }
        } catch (error) {
            console.error('Error getting organization status:', error)
            return {
                shopId: null,
                organizationId: null,
                adminType: null,
                canAccessOrganizationCustomers: false
            }
        }
    }

    /**
     * Fetch customers with organization-aware filtering using API
     */
    static async getCustomers(
        shopId: string,
        options?: {
            organizationWide?: boolean
            search?: string
            limit?: number
            page?: number
        }
    ): Promise<{ customers: OrganizationCustomer[], total: number, totalPages: number }> {
        try {
            if (!shopId) {
                return { customers: [], total: 0, totalPages: 0 }
            }

            const params = new URLSearchParams({
                page: (options?.page || 1).toString(),
                limit: (options?.limit || 50).toString()
            })

            if (options?.organizationWide) {
                params.set('organization_wide', 'true')
            }

            if (options?.search && options.search.trim()) {
                params.set('search', options.search.trim())
            }

            const response = await fetch(`/api/customers/organization?${params}`)
            
            if (!response.ok) {
                throw new Error(`Failed to fetch customers: ${response.status}`)
            }

            const data = await response.json()
            
            return {
                customers: data.customers || [],
                total: data.total || 0,
                totalPages: data.totalPages || 0
            }

        } catch (error) {
            console.error('Error in getCustomers:', error)
            return { customers: [], total: 0, totalPages: 0 }
        }
    }

    /**
     * Get customer count for pagination (now handled by the main API call)
     */
    static async getCustomerCount(
        shopId: string,
        options?: {
            organizationWide?: boolean
            search?: string
        }
    ): Promise<number> {
        // This is now handled by the main getCustomers call
        // Keeping this method for backward compatibility
        const result = await this.getCustomers(shopId, {
            organizationWide: options?.organizationWide,
            search: options?.search,
            limit: 1,
            page: 1
        })
        return result.total
    }
}
