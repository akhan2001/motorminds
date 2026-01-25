'use client'

import { useQuery } from '@tanstack/react-query'

// Types
export interface EmailRecord {
    id: string
    shop_id: string
    invoice_number: string
    recipient_email: string
    recipient_name: string
    subject: string
    body: string
    status: 'sent' | 'failed' | 'pending'
    email_provider_id?: string
    sent_at: string
    created_at?: string
}

export interface EmailHistoryResponse {
    emails: EmailRecord[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasMore: boolean
    }
}

export interface EmailStatsResponse {
    isConfigured: boolean
    service: string
    stats: {
        total: number
        today: number
        thisWeek: number
        thisMonth: number
        sent: number
        failed: number
    } | null
    error?: string
}

export interface EmailHistoryFilters {
    page?: number
    limit?: number
    search?: string
    status?: string
    dateFrom?: string
    dateTo?: string
}

// Fetch email history with filters
async function fetchEmailHistory(filters: EmailHistoryFilters): Promise<EmailHistoryResponse> {
    const params = new URLSearchParams()
    
    if (filters.page) params.set('page', String(filters.page))
    if (filters.limit) params.set('limit', String(filters.limit))
    if (filters.search) params.set('search', filters.search)
    if (filters.status) params.set('status', filters.status)
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.set('dateTo', filters.dateTo)

    const response = await fetch(`/api/email/history?${params.toString()}`)
    
    if (!response.ok) {
        throw new Error('Failed to fetch email history')
    }
    
    return response.json()
}

// Fetch email stats
async function fetchEmailStats(): Promise<EmailStatsResponse> {
    const response = await fetch('/api/email/stats')
    
    if (!response.ok) {
        throw new Error('Failed to fetch email stats')
    }
    
    return response.json()
}

// Hook to fetch email history with filters
export function useEmailHistory(filters: EmailHistoryFilters = {}) {
    return useQuery({
        queryKey: ['email-history', filters],
        queryFn: () => fetchEmailHistory(filters),
        staleTime: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true
    })
}

// Hook to fetch email stats
export function useEmailStats() {
    return useQuery({
        queryKey: ['email-stats'],
        queryFn: fetchEmailStats,
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true
    })
}
