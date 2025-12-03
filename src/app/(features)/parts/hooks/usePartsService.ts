import { useState, useEffect, useCallback } from 'react'
import { PartsService, PartsRequestFilters, PartsRequestsResponse } from '../lib/partsService'
import { PartsRequest, CreatePartsRequestRequest, UpdatePartsRequestRequest } from '../types/parts'
import { useAuth } from '@/lib/auth/AuthProvider'
import { toast } from 'sonner'

export interface UsePartsServiceOptions {
  autoFetch?: boolean
  filters?: PartsRequestFilters
  page?: number
  limit?: number
}

export function usePartsService(options: UsePartsServiceOptions = {}) {
  const { shopId } = useAuth()
  const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: options.page || 1,
    limit: options.limit || 50
  })

  // Fetch parts requests
  const fetchPartsRequests = useCallback(async (
    filters: PartsRequestFilters = {},
    page: number = 1,
    limit: number = 50
  ) => {
    if (!shopId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await PartsService.getPartsRequests(shopId, filters, page, limit)
      
      setPartsRequests(response.partsRequests)
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch parts requests'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [shopId])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (options.autoFetch !== false && shopId) {
      fetchPartsRequests(options.filters, options.page, options.limit)
    }
  }, [shopId, options.autoFetch, fetchPartsRequests])

  // Create parts request
  const createPartsRequest = useCallback(async (data: CreatePartsRequestRequest) => {
    if (!shopId) {
      toast.error('Shop ID is required')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      // Get current user (you might need to adjust this based on your auth system)
      const userId = 'current-user-id' // Replace with actual user ID logic
      
      const newRequest = await PartsService.createPartsRequest(shopId, userId, data)
      
      // Add to current list
      setPartsRequests(prev => [newRequest, ...prev])
      
      toast.success('Parts request created successfully')
      return newRequest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create parts request'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [shopId])

  // Update parts request
  const updatePartsRequest = useCallback(async (id: string, data: UpdatePartsRequestRequest) => {
    if (!shopId) return null

    try {
      setLoading(true)
      setError(null)
      
      const updatedRequest = await PartsService.updatePartsRequest(id, shopId, data)
      
      // Update in current list
      setPartsRequests(prev => 
        prev.map(req => req.id === id ? updatedRequest : req)
      )
      
      toast.success('Parts request updated successfully')
      return updatedRequest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update parts request'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [shopId])

  // Update status
  const updateStatus = useCallback(async (
    id: string, 
    status: PartsRequest['status'], 
    adminNotes?: string
  ) => {
    if (!shopId) return null

    try {
      setLoading(true)
      setError(null)
      
      const updatedRequest = await PartsService.updatePartsRequestStatus(id, shopId, status, adminNotes)
      
      // Update in current list
      setPartsRequests(prev => 
        prev.map(req => req.id === id ? updatedRequest : req)
      )
      
      toast.success(`Status updated to ${status}`)
      return updatedRequest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [shopId])

  // Add quote
  const addQuote = useCallback(async (id: string, quote: any, actualCost?: number) => {
    if (!shopId) return null

    try {
      setLoading(true)
      setError(null)
      
      const updatedRequest = await PartsService.addQuoteToPartsRequest(id, shopId, quote, actualCost)
      
      // Update in current list
      setPartsRequests(prev => 
        prev.map(req => req.id === id ? updatedRequest : req)
      )
      
      toast.success('Quote added successfully')
      return updatedRequest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add quote'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [shopId])

  // Delete parts request
  const deletePartsRequest = useCallback(async (id: string) => {
    if (!shopId) return false

    try {
      setLoading(true)
      setError(null)
      
      await PartsService.deletePartsRequest(id, shopId)
      
      // Remove from current list
      setPartsRequests(prev => prev.filter(req => req.id !== id))
      
      toast.success('Parts request deleted successfully')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete parts request'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [shopId])

  // Get single parts request
  const getPartsRequest = useCallback(async (id: string) => {
    if (!shopId) return null

    try {
      setLoading(true)
      setError(null)
      
      const request = await PartsService.getPartsRequestById(id, shopId)
      return request
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch parts request'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [shopId])

  // Get stats
  const getStats = useCallback(async () => {
    if (!shopId) return null

    try {
      const stats = await PartsService.getPartsRequestStats(shopId)
      return stats
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats'
      setError(errorMessage)
      return null
    }
  }, [shopId])

  // Refresh data
  const refresh = useCallback(() => {
    if (options.autoFetch !== false) {
      fetchPartsRequests(options.filters, pagination.page, pagination.limit)
    }
  }, [fetchPartsRequests, options.autoFetch, options.filters, pagination.page, pagination.limit])

  return {
    // Data
    partsRequests,
    loading,
    error,
    pagination,
    
    // Actions
    fetchPartsRequests,
    createPartsRequest,
    updatePartsRequest,
    updateStatus,
    addQuote,
    deletePartsRequest,
    getPartsRequest,
    getStats,
    refresh,
    
    // Utils
    clearError: () => setError(null)
  }
}

// Specialized hooks for common use cases
export function usePartsRequestsByStatus(status: PartsRequest['status']) {
  const { shopId } = useAuth()
  const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([])
  const [loading, setLoading] = useState(false)

  const fetchByStatus = useCallback(async () => {
    if (!shopId) return

    try {
      setLoading(true)
      const requests = await PartsService.getPartsRequestsByStatus(shopId, status)
      setPartsRequests(requests)
    } catch (err) {
      toast.error('Failed to fetch parts requests')
    } finally {
      setLoading(false)
    }
  }, [shopId, status])

  useEffect(() => {
    fetchByStatus()
  }, [fetchByStatus])

  return { partsRequests, loading, refresh: fetchByStatus }
}

export function usePartsRequestsWithQuotes() {
  const { shopId } = useAuth()
  const [partsRequests, setPartsRequests] = useState<PartsRequest[]>([])
  const [loading, setLoading] = useState(false)

  const fetchWithQuotes = useCallback(async () => {
    if (!shopId) return

    try {
      setLoading(true)
      const requests = await PartsService.getPartsRequestsWithQuotes(shopId)
      setPartsRequests(requests)
    } catch (err) {
      toast.error('Failed to fetch quoted parts requests')
    } finally {
      setLoading(false)
    }
  }, [shopId])

  useEffect(() => {
    fetchWithQuotes()
  }, [fetchWithQuotes])

  return { partsRequests, loading, refresh: fetchWithQuotes }
}
