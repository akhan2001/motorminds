import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'

interface CallStatus {
    callId: string
    status: 'ringing' | 'in-progress' | 'completed' | 'error' | 'timeout' | 'failed'
    startedAt?: string
    endedAt?: string
    duration?: number
    endedReason?: string
    analysis?: any
    quoteData?: any
    error?: string
    transcript?: any[]
    summary?: string
}

interface UseCallStatusOptions {
    enabled?: boolean
    pollInterval?: number
    timeout?: number
}

export function useCallStatus(
    callId: string | null,
    options: UseCallStatusOptions = {}
) {
    const {
        enabled = true,
        pollInterval = 5000, // 5 seconds
        timeout = 300000 // 5 minutes
    } = options

    const [status, setStatus] = useState<CallStatus | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const eventSourceRef = useRef<EventSource | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Optimized polling query with better caching
    const { data: polledStatus, refetch, isError: pollError } = useQuery({
        queryKey: ['call-status', callId],
        queryFn: async (): Promise<CallStatus | null> => {
            if (!callId) return null
            
            const response = await fetch(`/api/voice-calling/status?call_id=${callId}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            return response.json()
        },
        enabled: !!callId && enabled && !isConnected,
        refetchInterval: pollInterval,
        staleTime: 2000,
        retry: 2,
        retryDelay: 1000
    })

    // Optimized SSE connection with better error handling
    useEffect(() => {
        if (!callId || !enabled) return

        // Set up timeout
        timeoutRef.current = setTimeout(() => {
            eventSourceRef.current?.close()
        }, timeout)

        // Create SSE connection
        const eventSource = new EventSource(`/api/voice-calling/events?call_id=${callId}`)
        eventSourceRef.current = eventSource

        eventSource.onopen = () => setIsConnected(true)
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                setStatus(prev => ({ ...prev, ...data, callId: data.callId || callId }))
                
                // Log call completion from SSE
                if (data.status === 'completed' || data.type === 'call_completed') {
                    console.log('📡 SSE CALL COMPLETED:', {
                        callId: data.callId || callId,
                        status: data.status,
                        analysis: data.analysis || data.quote_data,
                        timestamp: new Date().toISOString()
                    })
                }
            } catch (error) {
                console.error('SSE parse error:', error)
            }
        }
        eventSource.onerror = () => {
            setIsConnected(false)
            refetch()
        }

        return () => {
            timeoutRef.current && clearTimeout(timeoutRef.current)
            eventSource.close()
            eventSourceRef.current = null
            setIsConnected(false)
        }
    }, [callId, enabled, timeout, refetch])

    // Update status from polling if SSE is not connected
    useEffect(() => {
        if (polledStatus && !isConnected) {
            setStatus(polledStatus)
            
            // Log call completion from polling
            if (polledStatus.status === 'completed') {
                console.log('🔄 POLLING CALL COMPLETED:', {
                    callId: polledStatus.callId,
                    status: polledStatus.status,
                    analysis: polledStatus.analysis,
                    timestamp: new Date().toISOString()
                })
            }
        }
    }, [polledStatus, isConnected])

    // Derived state
    const isLoading = !status && !!callId
    const isCompleted = status?.status === 'completed'
    const isFailed = ['error', 'timeout', 'failed'].includes(status?.status || '')
    const isInProgress = ['ringing', 'in-progress'].includes(status?.status || '')
    const hasAnalysis = !!status?.analysis
    const hasQuote = !!status?.quoteData

    return {
        status,
        isLoading,
        isCompleted,
        isFailed,
        isInProgress,
        hasAnalysis,
        hasQuote,
        isConnected,
        pollError,
        // Callback to manually refetch
        refetch: () => {
            if (isConnected && eventSourceRef.current) {
                // SSE is working, no need to refetch
                return
            }
            refetch()
        }
    }
}

// Hook for multiple calls monitoring
export function useMultipleCallStatus(callIds: string[]) {
    const [statuses, setStatuses] = useState<Map<string, CallStatus>>(new Map())

    // This could be enhanced to monitor multiple calls simultaneously
    // For now, it's a placeholder for future multi-call monitoring

    return {
        statuses,
        getStatus: (callId: string) => statuses.get(callId),
        hasActiveCalls: Array.from(statuses.values()).some(s =>
            ['ringing', 'in-progress'].includes(s.status)
        )
    }
}
