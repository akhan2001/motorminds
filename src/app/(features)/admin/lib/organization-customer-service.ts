import type { Customer } from '@/app/(features)/customers/types'

export class OrganizationCustomerService {
    static async getCustomers(params: {
        organizationId: string
        search?: string
        shopId?: string
        page?: number
        limit?: number
    }): Promise<{
        customers: Customer[]
        total: number
        page: number
        limit: number
        totalPages: number
    }> {
        const queryParams = new URLSearchParams({
            page: (params.page || 1).toString(),
            limit: (params.limit || 50).toString()
        })
        
        if (params.search) queryParams.set('search', params.search)
        if (params.shopId && params.shopId !== 'all') {
            queryParams.set('shopId', params.shopId)
        }

        const response = await fetch(
            `/api/admin/organization/customers?${queryParams}`
        )
        
        if (!response.ok) {
            throw new Error('Failed to fetch customers')
        }
        
        return response.json()
    }
}