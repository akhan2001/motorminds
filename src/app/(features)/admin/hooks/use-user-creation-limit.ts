'use client'

import { useQuery } from '@tanstack/react-query'
import { UserLimitService } from '../lib/user-limit-service'
import { useAdminContext } from '../components/admin-context/useAdminContext'
import type { UserCreationLimit } from '../types/user-creation'

export function useUserCreationLimit() {
    const { adminType } = useAdminContext()

    return useQuery<UserCreationLimit>({
        queryKey: ['admin', 'user-limit', adminType],
        queryFn: () => {
            if (adminType === 'organization-admin') {
                return UserLimitService.getOrganizationUserLimit()
            } else if (adminType === 'shop-admin') {
                return UserLimitService.getShopUserLimit()
            } else {
                // Super admin has no limit
                return Promise.resolve({
                    limit: Infinity,
                    current: 0,
                    remaining: Infinity,
                    canCreate: true
                })
            }
        },
        enabled: !!adminType && (adminType === 'organization-admin' || adminType === 'shop-admin'),
        staleTime: 10000 // 10 seconds
    })
}

