import { useState } from 'react'
import { toast } from 'sonner'
import type { CampaignRecipient } from '../types/mass-campaign'

interface RecipientStats {
    total: number
    pending: number
    sent: number
    failed: number
}

export function useCampaignRecipients(campaignId: string) {
    const [isLoading, setIsLoading] = useState(false)
    const [recipients, setRecipients] = useState<CampaignRecipient[]>([])
    const [stats, setStats] = useState<RecipientStats>({
        total: 0,
        pending: 0,
        sent: 0,
        failed: 0
    })

    // Fetch recipients for a campaign
    const fetchRecipients = async (status?: 'pending' | 'sent' | 'failed') => {
        setIsLoading(true)
        try {
            const url = status 
                ? `/api/messaging/campaigns/${campaignId}/recipients?status=${status}`
                : `/api/messaging/campaigns/${campaignId}/recipients`
            
            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to fetch recipients')
            
            const data = await response.json()
            setRecipients(data.recipients || [])
            
            // Calculate stats
            const recipientList = data.recipients || []
            setStats({
                total: recipientList.length,
                pending: recipientList.filter((r: CampaignRecipient) => r.status === 'pending').length,
                sent: recipientList.filter((r: CampaignRecipient) => r.status === 'sent').length,
                failed: recipientList.filter((r: CampaignRecipient) => r.status === 'failed').length
            })
            
            return data.recipients
        } catch (error: any) {
            console.error('Error fetching recipients:', error)
            toast.error('Failed to load recipients')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Add recipients to campaign
    const addRecipients = async (customerIds: string[]): Promise<void> => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/messaging/campaigns/${campaignId}/recipients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer_ids: customerIds })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to add recipients')
            }

            const data = await response.json()
            toast.success(`Added ${data.added} recipient(s)`)
            
            // Refresh recipients list
            await fetchRecipients()
        } catch (error: any) {
            console.error('Error adding recipients:', error)
            toast.error(error.message || 'Failed to add recipients')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Retry failed recipient
    const retryRecipient = async (recipientId: string): Promise<void> => {
        setIsLoading(true)
        try {
            const response = await fetch(
                `/api/messaging/campaigns/${campaignId}/recipients/${recipientId}/retry`,
                { method: 'POST' }
            )

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to retry recipient')
            }

            toast.success('Recipient queued for retry')
            
            // Refresh recipients list
            await fetchRecipients()
        } catch (error: any) {
            console.error('Error retrying recipient:', error)
            toast.error(error.message || 'Failed to retry recipient')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Retry all failed recipients
    const retryAllFailed = async (): Promise<void> => {
        setIsLoading(true)
        try {
            const response = await fetch(
                `/api/messaging/campaigns/${campaignId}/recipients/retry-failed`,
                { method: 'POST' }
            )

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to retry failed recipients')
            }

            const data = await response.json()
            toast.success(`Queued ${data.retried} recipient(s) for retry`)
            
            // Refresh recipients list
            await fetchRecipients()
        } catch (error: any) {
            console.error('Error retrying failed recipients:', error)
            toast.error(error.message || 'Failed to retry failed recipients')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Remove recipient from campaign (only for draft campaigns)
    const removeRecipient = async (recipientId: string): Promise<void> => {
        setIsLoading(true)
        try {
            const response = await fetch(
                `/api/messaging/campaigns/${campaignId}/recipients/${recipientId}`,
                { method: 'DELETE' }
            )

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to remove recipient')
            }

            toast.success('Recipient removed')
            
            // Refresh recipients list
            await fetchRecipients()
        } catch (error: any) {
            console.error('Error removing recipient:', error)
            toast.error(error.message || 'Failed to remove recipient')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return {
        recipients,
        stats,
        isLoading,
        fetchRecipients,
        addRecipients,
        retryRecipient,
        retryAllFailed,
        removeRecipient
    }
}

