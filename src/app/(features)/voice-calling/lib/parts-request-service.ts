/**
 * Parts Request Service
 * Handles API calls for parts requests
 */

import type { CreatePartsRequestData, PartsRequest } from '@/app/(features)/voice-calling/types'

// Keep local interface for backward compatibility
export interface CreatePartsRequestDataLegacy {
    vehicle_info: {
        year?: string
        make?: string
        model?: string
        vin?: string
        mileage?: string
        engine?: string
    }
    parts_requested: Array<{
        partName: string
        partNumber?: string
        quantity: number
        description?: string
    }>
    supplier_info: {
        selected_suppliers: Array<{
            id: string
            name: string
            phone_number?: string
            contact_person?: string
            isCustom?: boolean
        }>
    }
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    notes?: string
    customer_notes?: string
}

export interface PartsRequestLegacy {
    id: string
    created_at: string
    updated_at: string
    shop_id: string
    user_id?: string
    vehicle_info: any
    parts_requested: any[]
    total_estimated_price?: number
    status: 'pending' | 'quoted' | 'ordered' | 'fulfilled' | 'cancelled'
    priority: 'low' | 'normal' | 'high' | 'urgent'
    notes?: string
    customer_notes?: string
    assigned_to?: string
    admin_notes?: string
    quote_provided?: any
    actual_cost?: number
    supplier_info?: any
    order_placed_at?: string
    estimated_delivery?: string
    fulfilled_at?: string
}

export class PartsRequestService {
    private static baseUrl = '/api/parts-requests'

    /**
     * Create a new parts request
     */
    static async createPartsRequest(data: CreatePartsRequestData): Promise<PartsRequest> {
        try {
            console.log('📝 Creating parts request:', data)

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
            }

            const result = await response.json()
            console.log('✅ Parts request created successfully:', result)
            
            return result.data || result
        } catch (error: any) {
            console.error('❌ Error creating parts request:', error)
            throw new Error(error.message || 'Failed to create parts request')
        }
    }

    /**
     * Get all parts requests for the current shop
     */
    static async getPartsRequests(): Promise<PartsRequest[]> {
        try {
            const response = await fetch(this.baseUrl)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            console.error('❌ Error fetching parts requests:', error)
            throw new Error(error.message || 'Failed to fetch parts requests')
        }
    }

    /**
     * Get a specific parts request by ID
     */
    static async getPartsRequest(id: string): Promise<PartsRequest> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            console.error('❌ Error fetching parts request:', error)
            throw new Error(error.message || 'Failed to fetch parts request')
        }
    }

    /**
     * Update a parts request
     */
    static async updatePartsRequest(id: string, data: Partial<CreatePartsRequestData>): Promise<PartsRequest> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
            }

            const result = await response.json()
            return result.data || result
        } catch (error: any) {
            console.error('❌ Error updating parts request:', error)
            throw new Error(error.message || 'Failed to update parts request')
        }
    }

    /**
     * Delete a parts request
     */
    static async deletePartsRequest(id: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
            }
        } catch (error: any) {
            console.error('❌ Error deleting parts request:', error)
            throw new Error(error.message || 'Failed to delete parts request')
        }
    }
}
