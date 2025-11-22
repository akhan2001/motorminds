import type { PlatformSettings, OrganizationSettings, ShopSettings } from '../types/settings'

export class SettingsService {
    static async getPlatformSettings(): Promise<PlatformSettings> {
        try {
            const response = await fetch('/api/admin/settings/platform')
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch platform settings')
            }
            
            return data.settings
        } catch (error) {
            console.error('Error fetching platform settings:', error)
            throw error
        }
    }

    static async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
        try {
            const response = await fetch('/api/admin/settings/platform', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update platform settings')
            }
            
            return data.settings
        } catch (error) {
            console.error('Error updating platform settings:', error)
            throw error
        }
    }

    static async getOrganizationSettings(): Promise<OrganizationSettings> {
        try {
            const response = await fetch('/api/admin/organization/settings')
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch organization settings')
            }
            
            return data.settings
        } catch (error) {
            console.error('Error fetching organization settings:', error)
            throw error
        }
    }

    static async updateOrganizationSettings(settings: Partial<OrganizationSettings>): Promise<OrganizationSettings> {
        try {
            const response = await fetch('/api/admin/organization/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update organization settings')
            }
            
            return data.settings
        } catch (error) {
            console.error('Error updating organization settings:', error)
            throw error
        }
    }

    static async getShopSettings(): Promise<ShopSettings> {
        try {
            const response = await fetch('/api/admin/shop/settings')
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch shop settings')
            }
            
            return data.settings
        } catch (error) {
            console.error('Error fetching shop settings:', error)
            throw error
        }
    }

    static async updateShopSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
        try {
            const response = await fetch('/api/admin/shop/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update shop settings')
            }
            
            return data.settings
        } catch (error) {
            console.error('Error updating shop settings:', error)
            throw error
        }
    }
}

