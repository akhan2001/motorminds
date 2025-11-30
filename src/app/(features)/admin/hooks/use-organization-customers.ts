'use client'

import { useQuery } from '@tanstack/react-query'
import { OrganizationCustomerService } from '../lib/organization-customer-service'
import { useAdminContext } from '../components/admin-context/useAdminContext'

export function useOrganizationCustomers(params: {
    search?: string
    shopId?: string
    page?: number
    limit?: number
}) {
    const { organizationId } = useAdminContext()

    return useQuery({
        queryKey: ['admin', 'organization', organizationId, 'customers', params],
        queryFn: () => OrganizationCustomerService.getCustomers({
            organizationId: organizationId!,
            ...params
        }),
        enabled: !!organizationId,
        staleTime: 30000 // 30 seconds
    })
}