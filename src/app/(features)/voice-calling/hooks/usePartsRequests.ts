'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { PartsRequestStatus } from '../types/status'

export interface PartsRequest {
    id: string
    created_at: string
    vehicle_info: any
    parts_requested: any
    status: PartsRequestStatus
    priority: string
    notes?: string
    quote_provided?: any
    actual_cost?: number
    supplier_info?: any
    call_analysis?: any
}

interface UsePartsRequestsOptions {
    status?: PartsRequestStatus | 'all'
    limit?: number
}

export function usePartsRequests(options: UsePartsRequestsOptions = {}) {
    const { status = 'all', limit = 20 } = options
    const [requests, setRequests] = useState<PartsRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), [])

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            let query = supabase
                .from('parts_requests')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit)

            if (status !== 'all') {
                query = query.eq('status', status)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError
            setRequests(data || [])
        } catch (err) {
            console.error('Error fetching parts requests:', err)
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }, [supabase, status, limit])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const updateRequest = useCallback((updatedRequest: PartsRequest) => {
        setRequests(prev =>
            prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
        )
    }, [])

    const addRequest = useCallback((newRequest: PartsRequest) => {
        setRequests(prev => [newRequest, ...prev])
    }, [])

    const removeRequest = useCallback((requestId: string) => {
        setRequests(prev => prev.filter(req => req.id !== requestId))
    }, [])

    return {
        requests,
        loading,
        error,
        refetch: fetchRequests,
        updateRequest,
        addRequest,
        removeRequest
    }
}

