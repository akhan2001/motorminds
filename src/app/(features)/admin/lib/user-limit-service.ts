import type { UserCreationLimit } from '../types/user-creation'

export class UserLimitService {
    static async getOrganizationUserLimit(): Promise<UserCreationLimit> {
        try {
            const response = await fetch('/api/admin/organization/user-limit')
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch user limit')
            }
            
            return {
                limit: data.limit,
                current: data.current,
                remaining: data.remaining,
                canCreate: data.canCreate
            }
        } catch (error) {
            console.error('Error fetching organization user limit:', error)
            throw error
        }
    }

    static async getShopUserLimit(): Promise<UserCreationLimit> {
        try {
            const response = await fetch('/api/admin/shop/user-limit')
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch user limit')
            }
            
            return {
                limit: data.limit,
                maxTotal: data.maxTotal,
                current: data.current,
                remaining: data.remaining,
                canCreate: data.canCreate
            }
        } catch (error) {
            console.error('Error fetching shop user limit:', error)
            throw error
        }
    }

    static async getUserLimit(adminType: 'organization-admin' | 'shop-admin'): Promise<UserCreationLimit> {
        if (adminType === 'organization-admin') {
            return this.getOrganizationUserLimit()
        } else {
            return this.getShopUserLimit()
        }
    }
}

