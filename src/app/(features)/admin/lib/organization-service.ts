import type { Organization, OrganizationCreateData, OrganizationUpdateData } from '../types/organization'

export class OrganizationService {
    static async getAllOrganizations(): Promise<Organization[]> {
        try {
            const response = await fetch('/api/admin/organizations')
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch organizations')
            }
            
            return data.organizations || []
        } catch (error) {
            console.error('Error fetching organizations:', error)
            throw error
        }
    }

    static async getOrganizationById(id: string): Promise<Organization> {
        try {
            const response = await fetch(`/api/admin/organizations/${id}`)
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch organization')
            }
            
            return data.organization
        } catch (error) {
            console.error('Error fetching organization:', error)
            throw error
        }
    }

    static async createOrganization(data: OrganizationCreateData): Promise<Organization> {
        try {
            const response = await fetch('/api/admin/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to create organization')
            }
            
            return result.organization
        } catch (error) {
            console.error('Error creating organization:', error)
            throw error
        }
    }

    static async updateOrganization(id: string, data: OrganizationUpdateData): Promise<Organization> {
        try {
            const response = await fetch(`/api/admin/organizations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to update organization')
            }
            
            return result.organization
        } catch (error) {
            console.error('Error updating organization:', error)
            throw error
        }
    }

    static async deleteOrganization(id: string): Promise<void> {
        try {
            const response = await fetch(`/api/admin/organizations/${id}`, {
                method: 'DELETE'
            })
            
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete organization')
            }
        } catch (error) {
            console.error('Error deleting organization:', error)
            throw error
        }
    }

    static async getOrganizationShops(organizationId: string): Promise<any[]> {
        try {
            const response = await fetch(`/api/admin/organization/${organizationId}/shops`)
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch organization shops')
            }
            
            return data.shops || []
        } catch (error) {
            console.error('Error fetching organization shops:', error)
            throw error
        }
    }
}

