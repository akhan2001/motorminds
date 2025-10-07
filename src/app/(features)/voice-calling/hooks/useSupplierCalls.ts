'use client'

import { useState, useEffect, useCallback } from 'react'
import { PartsRequestService } from '../services/partsRequestService'

export interface VoiceCall {
    id: string
    supplier_id: string
    supplier_name?: string
    status: string
    sequence_number: number
    created_at: string
    quote_received?: any
    vapi_call_id?: string
}

export function useSupplierCalls(partsRequestId: string, refreshTrigger?: boolean) {
    const [calls, setCalls] = useState<VoiceCall[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchCalls = useCallback(async () => {
        if (!partsRequestId) return

        try {
            setLoading(true)
            setError(null)
            const data = await PartsRequestService.getVoiceCallsForRequest(partsRequestId)
            setCalls(data)
        } catch (err) {
            console.error('Error fetching supplier calls:', err)
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }, [partsRequestId])

    useEffect(() => {
        fetchCalls()
    }, [fetchCalls, refreshTrigger])

    return {
        calls,
        loading,
        error,
        refetch: fetchCalls
    }
}

