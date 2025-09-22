'use client'

import { useEffect, useMemo, useState } from 'react'

export interface UsePartsRequestsOptions {
    limit?: number
}

export function usePartsRequests(options: UsePartsRequestsOptions = {}) {
    const { limit } = options
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        const fetchRequests = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch('/api/parts-requests', { method: 'GET' })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err.error || `HTTP ${res.status}`)
                }
                const json = await res.json()
                const list: any[] = Array.isArray(json?.data) ? json.data : []
                if (!cancelled) {
                    setData(limit ? list.slice(0, limit) : list)
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Failed to load parts requests')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        fetchRequests()
        return () => {
            cancelled = true
        }
    }, [limit])

    const stats = useMemo(() => {
        const total = data.length
        const byStatus = data.reduce((acc: Record<string, number>, pr: any) => {
            const s = pr.status || 'unknown'
            acc[s] = (acc[s] || 0) + 1
            return acc
        }, {})
        return { total, byStatus }
    }, [data])

    return { data, loading, error, stats }
}


