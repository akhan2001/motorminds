import { createClient } from '@/utils/supabase/client'
import { PartsRequest, CreatePartsRequestRequest, UpdatePartsRequestRequest } from '@/app/(features)/parts/types/parts'

export interface PartsRequestFilters {
    status?: PartsRequest['status']
    priority?: PartsRequest['priority']
    supplier_id?: string
    assigned_to?: string
    date_from?: string
    date_to?: string
    search?: string
}

export interface PartsRequestsResponse {
    partsRequests: PartsRequest[]
    total: number
    page: number
    limit: number
}

export class PartsService {
    private static supabase = createClient()

    /**
     * Get all parts requests for a shop with optional filtering and pagination
     */
    static async getPartsRequests(
        shopId: string,
        filters: PartsRequestFilters = {},
        page: number = 1,
        limit: number = 50
    ): Promise<PartsRequestsResponse> {
        try {
            let query = this.supabase
                .from('parts_requests')
                .select('*', { count: 'exact' })
                .eq('shop_id', shopId)

            // Apply filters
            if (filters.status) {
                query = query.eq('status', filters.status)
            }

            if (filters.priority) {
                query = query.eq('priority', filters.priority)
            }

            if (filters.assigned_to) {
                query = query.eq('assigned_to', filters.assigned_to)
            }

            if (filters.supplier_id) {
                query = query.contains('supplier_info', { supplier_id: filters.supplier_id })
            }

            if (filters.date_from) {
                query = query.gte('created_at', filters.date_from)
            }

            if (filters.date_to) {
                query = query.lte('created_at', filters.date_to)
            }

            // Text search across multiple fields
            if (filters.search) {
                query = query.or(`
          parts_requested->>part_name.ilike.%${filters.search}%,
          parts_requested->>part_number.ilike.%${filters.search}%,
          supplier_info->>supplier_name.ilike.%${filters.search}%,
          vehicle_info->>customer_name.ilike.%${filters.search}%,
          notes.ilike.%${filters.search}%,
          customer_notes.ilike.%${filters.search}%
        `)
            }

            // Pagination
            const offset = (page - 1) * limit
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

            const { data, error, count } = await query

            if (error) {
                console.error('Error fetching parts requests:', error)
                throw new Error(`Failed to fetch parts requests: ${error.message}`)
            }

            return {
                partsRequests: data || [],
                total: count || 0,
                page,
                limit
            }
        } catch (error) {
            console.error('PartsService.getPartsRequests error:', error)
            throw error
        }
    }

    /**
     * Get a single parts request by ID
     */
    static async getPartsRequestById(id: string, shopId: string): Promise<PartsRequest | null> {
        try {
            const { data, error } = await this.supabase
                .from('parts_requests')
                .select('*')
                .eq('id', id)
                .eq('shop_id', shopId)
                .single()

            if (error) {
                console.error('Error fetching parts request:', error)
                throw new Error(`Failed to fetch parts request: ${error.message}`)
            }

            return data
        } catch (error) {
            console.error('PartsService.getPartsRequestById error:', error)
            throw error
        }
    }

    static async createNewPartsRequest(
        shopId: string,
        data: CreatePartsRequestRequest
    ): Promise<PartsRequest> {
        const supabase = await createClient();

        // Validate required fields
        if (!data.supplier_info?.supplier_name?.trim()) {
            throw new Error('Supplier name is required')
        }
        if (!data.parts_requested || data.parts_requested.length === 0) {
            throw new Error('At least one part is required')
        }

        // Validate each part
        for (const part of data.parts_requested) {
            if (!part.part_number?.trim()) {
                throw new Error('Part number is required for all parts')
            }
            if (!part.part_name?.trim()) {
                throw new Error('Part name is required for all parts')
            }
            if (!part.quantity || part.quantity <= 0) {
                throw new Error('Valid quantity is required for all parts')
            }
        }

        // Calculate total estimated price
        const totalEstimatedPrice = data.parts_requested.reduce((total, part) => {
            return total + ((part.estimated_price || 0) * part.quantity)
        }, 0)

        const insertData = {
            shop_id: shopId,
            vehicle_info: data.vehicle_info || {},
            parts_requested: data.parts_requested,
            supplier_info: data.supplier_info,
            total_estimated_price: totalEstimatedPrice,
            priority: data.priority || 'normal',
            notes: data.notes?.trim() || null,
            customer_notes: data.customer_notes?.trim() || null,
            status: 'pending' as const
        }

        const { data: partsRequest, error } = await supabase
            .from('parts_requests')
            .insert(insertData)
            .select('*')
            .single();

        if (error) {
            console.error('Error creating parts request:', error)
            throw new Error(`Failed to create parts request: ${error.message}`)
        }

        return partsRequest;
    }


     /**
      * Create a new parts request
      */
     static async createPartsRequest(
         shopId: string,
         data: CreatePartsRequestRequest
     ): Promise<PartsRequest> {
         try {
             // Validate required fields
             if (!data.supplier_info?.supplier_name?.trim()) {
                 throw new Error('Supplier name is required')
             }
             if (!data.parts_requested || data.parts_requested.length === 0) {
                 throw new Error('At least one part is required')
             }

             // Validate each part
             for (const part of data.parts_requested) {
                 if (!part.part_number?.trim()) {
                     throw new Error('Part number is required for all parts')
                 }
                 if (!part.part_name?.trim()) {
                     throw new Error('Part name is required for all parts')
                 }
                 if (!part.quantity || part.quantity <= 0) {
                     throw new Error('Valid quantity is required for all parts')
                 }
             }

             // Calculate total estimated price
             const totalEstimatedPrice = data.parts_requested.reduce((total, part) => {
                 return total + ((part.estimated_price || 0) * part.quantity)
             }, 0)

             const supabase = await createClient();

             const { data: partsRequest, error } = await supabase
               .from('parts_requests')
               .insert([{
                 shop_id: shopId,
                 vehicle_info: data.vehicle_info || {},
                 parts_requested: data.parts_requested,
                 supplier_info: data.supplier_info,
                 total_estimated_price: totalEstimatedPrice,
                 priority: data.priority || 'normal',
                 notes: data.notes?.trim() || null,
                 customer_notes: data.customer_notes?.trim() || null,
                 status: 'pending' as const
               }])
               .select()
               .single();
             
             if (error) {
                 console.error('Error creating parts request:', error)
                 throw new Error(`Failed to create parts request: ${error.message}`)
             }

             return partsRequest;
         } catch (error) {
             console.error('PartsService.createPartsRequest error:', error)
             throw error
         }
     }

    /**
     * Update a parts request
     */
    static async updatePartsRequest(
        id: string,
        shopId: string,
        data: UpdatePartsRequestRequest
    ): Promise<PartsRequest> {
        try {
            const updateData: any = {
                ...data,
                updated_at: new Date().toISOString()
            }

            // Recalculate total if parts_requested is updated
            if (data.parts_requested) {
                updateData.total_estimated_price = data.parts_requested.reduce((total, part) => {
                    return total + ((part.estimated_price || 0) * part.quantity)
                }, 0)
            }

            const { data: partsRequest, error } = await this.supabase
                .from('parts_requests')
                .update(updateData)
                .eq('id', id)
                .eq('shop_id', shopId)
                .select('*')
                .single()

            if (error) {
                console.error('Error updating parts request:', error)
                throw new Error(`Failed to update parts request: ${error.message}`)
            }

            return partsRequest
        } catch (error) {
            console.error('PartsService.updatePartsRequest error:', error)
            throw error
        }
    }

    /**
     * Update parts request status
     */
    static async updatePartsRequestStatus(
        id: string,
        shopId: string,
        status: PartsRequest['status'],
        adminNotes?: string
    ): Promise<PartsRequest> {
        try {
            const updateData: any = {
                status,
                updated_at: new Date().toISOString()
            }

            // Set specific timestamps based on status
            if (status === 'ordered') {
                updateData.order_placed_at = new Date().toISOString()
            } else if (status === 'received') {
                updateData.fulfilled_at = new Date().toISOString()
            }

            if (adminNotes) {
                updateData.admin_notes = adminNotes
            }

            const { data: partsRequest, error } = await this.supabase
                .from('parts_requests')
                .update(updateData)
                .eq('id', id)
                .eq('shop_id', shopId)
                .select('*')
                .single()

            if (error) {
                console.error('Error updating parts request status:', error)
                throw new Error(`Failed to update parts request status: ${error.message}`)
            }

            return partsRequest
        } catch (error) {
            console.error('PartsService.updatePartsRequestStatus error:', error)
            throw error
        }
    }

    /**
     * Add quote to parts request
     */
    static async addQuoteToPartsRequest(
        id: string,
        shopId: string,
        quote: any,
        actualCost?: number
    ): Promise<PartsRequest> {
        try {
            const updateData: any = {
                quote_provided: quote,
                status: 'quoted' as const,
                updated_at: new Date().toISOString()
            }

            if (actualCost !== undefined) {
                updateData.actual_cost = actualCost
                updateData.total_estimated_price = actualCost
            }

            const { data: partsRequest, error } = await this.supabase
                .from('parts_requests')
                .update(updateData)
                .eq('id', id)
                .eq('shop_id', shopId)
                .select('*')
                .single()

            if (error) {
                console.error('Error adding quote to parts request:', error)
                throw new Error(`Failed to add quote to parts request: ${error.message}`)
            }

            return partsRequest
        } catch (error) {
            console.error('PartsService.addQuoteToPartsRequest error:', error)
            throw error
        }
    }

    /**
     * Delete a parts request
     */
    static async deletePartsRequest(id: string, shopId: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('parts_requests')
                .delete()
                .eq('id', id)
                .eq('shop_id', shopId)

            if (error) {
                console.error('Error deleting parts request:', error)
                throw new Error(`Failed to delete parts request: ${error.message}`)
            }
        } catch (error) {
            console.error('PartsService.deletePartsRequest error:', error)
            throw error
        }
    }

    /**
     * Get parts requests by status
     */
    static async getPartsRequestsByStatus(
        shopId: string,
        status: PartsRequest['status']
    ): Promise<PartsRequest[]> {
        try {
            const { data, error } = await this.supabase
                .from('parts_requests')
                .select('*')
                .eq('shop_id', shopId)
                .eq('status', status)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching parts requests by status:', error)
                throw new Error(`Failed to fetch parts requests by status: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('PartsService.getPartsRequestsByStatus error:', error)
            throw error
        }
    }

    /**
     * Get parts requests with quotes
     */
    static async getPartsRequestsWithQuotes(shopId: string): Promise<PartsRequest[]> {
        try {
            const { data, error } = await this.supabase
                .from('parts_requests')
                .select('*')
                .eq('shop_id', shopId)
                .not('quote_provided', 'is', null)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching parts requests with quotes:', error)
                throw new Error(`Failed to fetch parts requests with quotes: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('PartsService.getPartsRequestsWithQuotes error:', error)
            throw error
        }
    }

    /**
     * Get recent parts requests (last 30 days)
     */
    static async getRecentPartsRequests(shopId: string): Promise<PartsRequest[]> {
        try {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data, error } = await this.supabase
                .from('parts_requests')
                .select('*')
                .eq('shop_id', shopId)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching recent parts requests:', error)
                throw new Error(`Failed to fetch recent parts requests: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('PartsService.getRecentPartsRequests error:', error)
            throw error
        }
    }

    /**
     * Get parts request statistics for a shop
     */
    static async getPartsRequestStats(shopId: string): Promise<{
        total: number
        pending: number
        processing: number
        quoted: number
        ordered: number
        received: number
        cancelled: number
        totalValue: number
    }> {
        try {
            const { data, error } = await this.supabase
                .from('parts_requests')
                .select('status, total_estimated_price')
                .eq('shop_id', shopId)

            if (error) {
                console.error('Error fetching parts request stats:', error)
                throw new Error(`Failed to fetch parts request stats: ${error.message}`)
            }

            const stats = {
                total: data?.length || 0,
                pending: 0,
                processing: 0,
                quoted: 0,
                ordered: 0,
                received: 0,
                cancelled: 0,
                totalValue: 0
            }

            data?.forEach(request => {
                stats[request.status as keyof typeof stats]++
                stats.totalValue += request.total_estimated_price || 0
            })

            return stats
        } catch (error) {
            console.error('PartsService.getPartsRequestStats error:', error)
            throw error
        }
    }

    /**
     * Search parts requests
     */
    static async searchPartsRequests(
        shopId: string,
        searchTerm: string,
        limit: number = 20
    ): Promise<PartsRequest[]> {
        try {
            const { data, error } = await this.supabase
                .from('parts_requests')
                .select('*')
                .eq('shop_id', shopId)
                .or(`
          parts_requested->>part_name.ilike.%${searchTerm}%,
          parts_requested->>part_number.ilike.%${searchTerm}%,
          supplier_info->>supplier_name.ilike.%${searchTerm}%,
          vehicle_info->>customer_name.ilike.%${searchTerm}%,
          notes.ilike.%${searchTerm}%,
          customer_notes.ilike.%${searchTerm}%
        `)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (error) {
                console.error('Error searching parts requests:', error)
                throw new Error(`Failed to search parts requests: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('PartsService.searchPartsRequests error:', error)
            throw error
        }
    }

    /**
     * Get parts requests assigned to a user
     */
    static async getAssignedPartsRequests(
        shopId: string,
        userId: string
    ): Promise<PartsRequest[]> {
        try {
            const { data, error } = await this.supabase
                .from('parts_requests')
                .select('*')
                .eq('shop_id', shopId)
                .eq('assigned_to', userId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching assigned parts requests:', error)
                throw new Error(`Failed to fetch assigned parts requests: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('PartsService.getAssignedPartsRequests error:', error)
            throw error
        }
    }
}
